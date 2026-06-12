# live_analysis.py
from __future__ import annotations

import json
import os
import threading
import time
from collections import deque
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import torch
import torch.nn as nn
from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from torchvision.models.video import r3d_18
from ultralytics import YOLO

router = APIRouter()

# ============================================================
# PATHS
# ============================================================
_repo_root = Path(__file__).resolve().parents[4]
_model_dir = _repo_root / "models"

_fish_detector_path = _model_dir / "disease" / "fish_detector_v2.pt"
_fish_detector_fallback_path = _model_dir / "disease" / "fish_detector.pt"

_disease_classifier_path = _model_dir / "disease" / "disease_classifier.pt"

_behavior_model_path = _model_dir / "behavior" / "best_model.pth"
_behavior_classes_path = _model_dir / "behavior" / "classes.json"

# ============================================================
# CONSTANTS
# ============================================================
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))

TARGET_FPS = 15
JPEG_QUALITY = 80

# Fish detection
FISH_CONF = 0.25
FISH_IOU = 0.50
FISH_IMGSZ = 640
DETECT_EVERY_N_FRAMES = 5

# Disease classification
DISEASE_IMGSZ = 224
DISEASE_ALERT_CONF = 0.80

# Behavior
NUM_FRAMES = 16
BEHAVIOR_IMGSZ = 112
BEHAVIOR_UPDATE_SECONDS = 2.0

# UI colors BGR
COLOR_GREEN = (0, 220, 0)
COLOR_RED = (0, 0, 255)
COLOR_ORANGE = (0, 165, 255)
COLOR_YELLOW = (0, 255, 255)
COLOR_WHITE = (255, 255, 255)
COLOR_BLACK = (0, 0, 0)
COLOR_BAR = (20, 20, 20)
COLOR_BLUE = (255, 120, 0)

# ============================================================
# GLOBAL STATE
# ============================================================
_device = "cuda" if torch.cuda.is_available() else "cpu"

_models_loaded = False
_models_lock = threading.Lock()

_fish_detector: YOLO | None = None
_disease_cls: YOLO | None = None
_behavior_model: nn.Module | None = None
_behavior_classes: list[str] = []

_frame_buffer: deque[np.ndarray] = deque(maxlen=NUM_FRAMES)

_behavior_lock = threading.Lock()
_behavior_result: dict[str, Any] = {
    "label": "normal_swimming",
    "confidence": 0.0,
    "updated_at": None,
}

_behavior_thread_running = False

_detection_lock = threading.Lock()
_cached_detections: list[dict[str, Any]] = []
_cached_fish_count = 0

# ============================================================
# MODEL LOADING
# ============================================================
def _load_behavior_classes() -> list[str]:
    if not _behavior_classes_path.exists():
        return [
            "dead_or_moribund_floating",
            "erratic_or_chasing",
            "feeding_response",
            "group_swimming",
            "lethargic_low_activity",
            "normal_swimming",
            "surface_gasping",
            "swim_bladder_concern",
        ]

    with open(_behavior_classes_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return [str(x) for x in data]

    if isinstance(data, dict):
        # Supports either {"0": "normal_swimming"} or {"normal_swimming": 0}
        if all(str(k).isdigit() for k in data.keys()):
            return [data[str(i)] for i in range(len(data))]
        sorted_items = sorted(data.items(), key=lambda kv: kv[1])
        return [str(k) for k, _ in sorted_items]

    return []


def _build_behavior_model(num_classes: int) -> nn.Module:
    model = r3d_18(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model


def _load_models() -> None:
    global _models_loaded
    global _fish_detector, _disease_cls, _behavior_model, _behavior_classes

    with _models_lock:
        if _models_loaded:
            return

        print("Loading live analysis models...")

        # Fish detector
        detector_path = None
        if _fish_detector_path.exists():
            detector_path = _fish_detector_path
        elif _fish_detector_fallback_path.exists():
            detector_path = _fish_detector_fallback_path

        if detector_path is not None:
            print(f"Loading fish detector: {detector_path}")
            _fish_detector = YOLO(str(detector_path))
        else:
            print("WARNING: No fish detector found.")

        # Disease classifier
        if _disease_classifier_path.exists():
            print(f"Loading disease classifier: {_disease_classifier_path}")
            _disease_cls = YOLO(str(_disease_classifier_path))
            print(f"Disease classes: {_disease_cls.names}")
        else:
            print("WARNING: disease_classifier.pt not found.")

        # Behavior model
        _behavior_classes = _load_behavior_classes()

        if _behavior_model_path.exists() and len(_behavior_classes) > 0:
            try:
                print(f"Loading behavior model: {_behavior_model_path}")
                _behavior_model = _build_behavior_model(len(_behavior_classes))

                checkpoint = torch.load(
                    str(_behavior_model_path),
                    map_location=_device,
                )

                if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                    state_dict = checkpoint["model_state_dict"]
                elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                    state_dict = checkpoint["state_dict"]
                else:
                    state_dict = checkpoint

                cleaned_state_dict = {}
                for k, v in state_dict.items():
                    new_k = k.replace("module.", "")
                    cleaned_state_dict[new_k] = v

                _behavior_model.load_state_dict(cleaned_state_dict, strict=False)
                _behavior_model.to(_device)
                _behavior_model.eval()

                print(f"Behavior classes: {_behavior_classes}")

            except Exception as e:
                print(f"WARNING: Could not load behavior model: {e}")
                _behavior_model = None
        else:
            print("WARNING: behavior model/classes not found.")

        _models_loaded = True
        print("Model loading complete.")


# ============================================================
# CAMERA
# ============================================================
def _open_camera(camera_idx: int) -> cv2.VideoCapture:
    """
    DEFAULT backend first because DroidCam worked with DEFAULT on your system.
    No forced DSHOW.
    """
    candidates = [camera_idx, 0, 1, 2, 3]

    seen = set()
    ordered_candidates = []

    for idx in candidates:
        if idx not in seen:
            seen.add(idx)
            ordered_candidates.append(idx)

    for idx in ordered_candidates:
        print(f"Trying camera index {idx} with DEFAULT backend...")
        cap = cv2.VideoCapture(idx)

        if not cap.isOpened():
            cap.release()
            continue

        ret, frame = cap.read()

        if ret and frame is not None:
            print(f"Camera opened: index={idx}, shape={frame.shape}")

            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            return cap

        cap.release()

    raise RuntimeError("Could not open camera. Stop uvicorn/browser using camera and keep DroidCam open.")


# ============================================================
# IMAGE / VIDEO HELPERS
# ============================================================
def _encode_jpeg(frame: np.ndarray) -> bytes:
    ok, buffer = cv2.imencode(
        ".jpg",
        frame,
        [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY],
    )

    if not ok:
        return b""

    return buffer.tobytes()


def _mjpeg_frame(frame: np.ndarray) -> bytes:
    jpg = _encode_jpeg(frame)
    return (
        b"--frame\r\n"
        b"Content-Type: image/jpeg\r\n\r\n" + jpg + b"\r\n"
    )


def _draw_text_with_bg(
    frame: np.ndarray,
    text: str,
    pos: tuple[int, int],
    font_scale: float = 0.6,
    color: tuple[int, int, int] = COLOR_WHITE,
    bg_color: tuple[int, int, int] = COLOR_BLACK,
    thickness: int = 1,
) -> None:
    x, y = pos
    font = cv2.FONT_HERSHEY_SIMPLEX

    (tw, th), baseline = cv2.getTextSize(text, font, font_scale, thickness)
    cv2.rectangle(
        frame,
        (x - 4, y - th - 6),
        (x + tw + 4, y + baseline + 4),
        bg_color,
        -1,
    )
    cv2.putText(frame, text, (x, y), font, font_scale, color, thickness, cv2.LINE_AA)


def _preprocess_behavior_frame(frame: np.ndarray) -> np.ndarray:
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(frame_rgb, (BEHAVIOR_IMGSZ, BEHAVIOR_IMGSZ))
    arr = resized.astype(np.float32) / 255.0

    mean = np.array([0.43216, 0.394666, 0.37645], dtype=np.float32)
    std = np.array([0.22803, 0.22145, 0.216989], dtype=np.float32)

    arr = (arr - mean) / std
    return arr


def _behavior_label_pretty(label: str) -> str:
    return label.replace("_", " ").title()


def _is_abnormal_behavior(label: str, conf: float) -> bool:
    abnormal_keywords = [
        "dead",
        "moribund",
        "erratic",
        "chasing",
        "lethargic",
        "surface",
        "gasping",
        "swim_bladder",
        "concern",
    ]

    label_lower = label.lower()
    return conf >= 0.55 and any(k in label_lower for k in abnormal_keywords)


# ============================================================
# BEHAVIOR WORKER
# ============================================================
def _behavior_worker() -> None:
    global _behavior_thread_running

    last_run = 0.0

    while _behavior_thread_running:
        time.sleep(0.05)

        if _behavior_model is None:
            continue

        now = time.time()

        if now - last_run < BEHAVIOR_UPDATE_SECONDS:
            continue

        if len(_frame_buffer) < NUM_FRAMES:
            continue

        last_run = now

        try:
            frames = list(_frame_buffer)[-NUM_FRAMES:]
            arr = np.stack(frames, axis=0)  # T, H, W, C
            arr = np.transpose(arr, (3, 0, 1, 2))  # C, T, H, W
            tensor = torch.from_numpy(arr).unsqueeze(0).float().to(_device)

            with torch.no_grad():
                logits = _behavior_model(tensor)
                probs = torch.softmax(logits, dim=1)[0]
                conf, idx = torch.max(probs, dim=0)

            idx_int = int(idx.item())
            conf_float = float(conf.item())

            if 0 <= idx_int < len(_behavior_classes):
                label = _behavior_classes[idx_int]
            else:
                label = "unknown"

            with _behavior_lock:
                _behavior_result.update(
                    {
                        "label": label,
                        "confidence": conf_float,
                        "updated_at": time.time(),
                    }
                )

        except Exception as e:
            print(f"Behavior worker error: {e}")


def _ensure_behavior_thread() -> None:
    global _behavior_thread_running

    if _behavior_thread_running:
        return

    _behavior_thread_running = True
    thread = threading.Thread(target=_behavior_worker, daemon=True)
    thread.start()


# ============================================================
# DISEASE DETECTION / CLASSIFICATION
# ============================================================
def _classify_disease_crop(crop: np.ndarray) -> tuple[str, float, bool]:
    """
    Returns:
        final_label, confidence, is_alert

    Strict logic:
    - Healthy is default.
    - Disease only counts if non-Healthy and confidence >= DISEASE_ALERT_CONF.
    """
    if _disease_cls is None:
        return "Unknown", 0.0, False

    try:
        pred = _disease_cls(crop, imgsz=DISEASE_IMGSZ, verbose=False)[0]
        raw_label = _disease_cls.names[int(pred.probs.top1)]
        raw_conf = float(pred.probs.top1conf)

        if raw_label != "Healthy" and raw_conf >= DISEASE_ALERT_CONF:
            return raw_label, raw_conf, True

        return "Healthy", raw_conf, False

    except Exception as e:
        print(f"Disease classification error: {e}")
        return "Unknown", 0.0, False


def _run_fish_detection_and_disease(frame: np.ndarray) -> tuple[list[dict[str, Any]], int]:
    if _fish_detector is None:
        return [], 0

    h_frame, w_frame = frame.shape[:2]

    try:
        result = _fish_detector(
            frame,
            conf=FISH_CONF,
            iou=FISH_IOU,
            imgsz=FISH_IMGSZ,
            verbose=False,
        )[0]

        detections = []

        for i, box in enumerate(result.boxes):
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            det_conf = float(box.conf)

            x1 = max(0, min(x1, w_frame - 1))
            x2 = max(0, min(x2, w_frame - 1))
            y1 = max(0, min(y1, h_frame - 1))
            y2 = max(0, min(y2, h_frame - 1))

            bw = x2 - x1
            bh = y2 - y1

            # Reject tiny garbage boxes
            if bw < 15 or bh < 15:
                continue

            crop = frame[y1:y2, x1:x2]

            if crop.size == 0:
                continue

            disease_label, disease_conf, is_alert = _classify_disease_crop(crop)

            detections.append(
                {
                    "id": len(detections) + 1,
                    "box": [x1, y1, x2, y2],
                    "det_conf": det_conf,
                    "disease_label": disease_label,
                    "disease_conf": disease_conf,
                    "is_alert": is_alert,
                }
            )

        return detections, len(detections)

    except Exception as e:
        print(f"Fish detection error: {e}")
        return [], 0


# ============================================================
# DRAWING: DISEASE STREAM
# ============================================================
def _draw_disease_overlay(
    frame: np.ndarray,
    detections: list[dict[str, Any]],
    fish_count: int,
) -> np.ndarray:
    h, w = frame.shape[:2]

    # Top bar
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 70), COLOR_BAR, -1)
    cv2.addWeighted(overlay, 0.65, frame, 0.35, 0, frame)

    _draw_text_with_bg(
        frame,
        f"Fish Count: {fish_count}",
        (15, 42),
        font_scale=0.9,
        color=COLOR_YELLOW,
        bg_color=COLOR_BAR,
        thickness=2,
    )

    alert_detections = [d for d in detections if d["is_alert"]]

    if not alert_detections:
        _draw_text_with_bg(
            frame,
            "Disease Status: All detected fish appear healthy",
            (270, 42),
            font_scale=0.75,
            color=COLOR_GREEN,
            bg_color=COLOR_BAR,
            thickness=2,
        )
    else:
        _draw_text_with_bg(
            frame,
            f"Disease Alert: {len(alert_detections)} fish flagged",
            (270, 42),
            font_scale=0.75,
            color=COLOR_RED,
            bg_color=COLOR_BAR,
            thickness=2,
        )

    # Draw only confirmed disease boxes.
    # Healthy fish are not boxed to keep UI clean.
    for d in detections:
        x1, y1, x2, y2 = d["box"]
        label = d["disease_label"]
        conf = d["disease_conf"]
        det_conf = d["det_conf"]

        if d["is_alert"]:
            color = COLOR_RED if label in ["Bacterial", "Parasitic_Viral"] else COLOR_ORANGE

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

            _draw_text_with_bg(
                frame,
                f"Fish #{d['id']} {label} {conf:.0%}",
                (x1, max(20, y1 - 8)),
                font_scale=0.5,
                color=COLOR_WHITE,
                bg_color=color,
                thickness=1,
            )

            _draw_text_with_bg(
                frame,
                f"det {det_conf:.2f}",
                (x1, min(h - 10, y2 + 18)),
                font_scale=0.4,
                color=COLOR_WHITE,
                bg_color=color,
                thickness=1,
            )

    # Bottom alert panel
    if alert_detections:
        panel_h = 35 + 25 * len(alert_detections)
        panel_w = 430
        x0 = max(10, w - panel_w - 20)
        y0 = max(80, h - panel_h - 20)

        overlay = frame.copy()
        cv2.rectangle(overlay, (x0, y0), (x0 + panel_w, y0 + panel_h), (0, 0, 80), -1)
        cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

        _draw_text_with_bg(
            frame,
            "CONFIRMED DISEASE ALERT",
            (x0 + 12, y0 + 25),
            font_scale=0.55,
            color=COLOR_WHITE,
            bg_color=(0, 0, 80),
            thickness=1,
        )

        for idx, d in enumerate(alert_detections):
            line = f"Fish #{d['id']}: {d['disease_label']} ({d['disease_conf']:.0%})"
            _draw_text_with_bg(
                frame,
                line,
                (x0 + 12, y0 + 50 + idx * 23),
                font_scale=0.48,
                color=COLOR_WHITE,
                bg_color=(0, 0, 80),
                thickness=1,
            )

    return frame


# ============================================================
# DRAWING: BEHAVIOR STREAM
# ============================================================
def _draw_behavior_overlay(
    frame: np.ndarray,
    detections: list[dict[str, Any]],
    fish_count: int,
) -> np.ndarray:
    h, w = frame.shape[:2]

    with _behavior_lock:
        behavior = dict(_behavior_result)

    label = behavior.get("label", "unknown")
    conf = float(behavior.get("confidence", 0.0) or 0.0)

    pretty_label = _behavior_label_pretty(label)
    abnormal = _is_abnormal_behavior(label, conf)

    # Top bar
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 80), COLOR_BAR, -1)
    cv2.addWeighted(overlay, 0.68, frame, 0.32, 0, frame)

    _draw_text_with_bg(
        frame,
        f"Fish Count: {fish_count}",
        (15, 45),
        font_scale=0.85,
        color=COLOR_YELLOW,
        bg_color=COLOR_BAR,
        thickness=2,
    )

    behavior_color = COLOR_RED if abnormal else COLOR_GREEN

    _draw_text_with_bg(
        frame,
        f"Tank Behavior: {pretty_label} ({conf:.0%})",
        (270, 45),
        font_scale=0.82,
        color=behavior_color,
        bg_color=COLOR_BAR,
        thickness=2,
    )

    # Behavior model is whole-tank.
    # So boxes here are fish-location context, not true per-fish behavior classification.
    # For clean demo:
    # - normal behavior: no boxes
    # - abnormal behavior: draw all fish boxes as "observe"
    if abnormal:
        for d in detections:
            x1, y1, x2, y2 = d["box"]
            cv2.rectangle(frame, (x1, y1), (x2, y2), COLOR_ORANGE, 2)

            _draw_text_with_bg(
                frame,
                f"Observe Fish #{d['id']}",
                (x1, max(20, y1 - 8)),
                font_scale=0.48,
                color=COLOR_WHITE,
                bg_color=COLOR_ORANGE,
                thickness=1,
            )

        panel_w = 460
        panel_h = 75
        x0 = max(10, w - panel_w - 20)
        y0 = max(90, h - panel_h - 20)

        overlay = frame.copy()
        cv2.rectangle(overlay, (x0, y0), (x0 + panel_w, y0 + panel_h), (0, 70, 120), -1)
        cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

        _draw_text_with_bg(
            frame,
            "BEHAVIOR ALERT",
            (x0 + 12, y0 + 28),
            font_scale=0.65,
            color=COLOR_WHITE,
            bg_color=(0, 70, 120),
            thickness=2,
        )

        _draw_text_with_bg(
            frame,
            f"{pretty_label} detected with {conf:.0%} confidence",
            (x0 + 12, y0 + 56),
            font_scale=0.5,
            color=COLOR_WHITE,
            bg_color=(0, 70, 120),
            thickness=1,
        )
    else:
        _draw_text_with_bg(
            frame,
            "Behavior Status: Normal tank-level behavior",
            (15, h - 25),
            font_scale=0.65,
            color=COLOR_GREEN,
            bg_color=COLOR_BAR,
            thickness=2,
        )

    return frame


# ============================================================
# STREAM GENERATORS
# ============================================================
def _generate_disease_frames(camera_idx: int):
    _load_models()
    _ensure_behavior_thread()

    cap = _open_camera(camera_idx)

    frame_id = 0
    frame_delay = 1.0 / TARGET_FPS

    global _cached_detections, _cached_fish_count

    try:
        while True:
            loop_start = time.time()

            ok, frame = cap.read()

            if not ok or frame is None:
                time.sleep(0.03)
                continue

            frame_id += 1

            # Feed behavior buffer too, so status works while disease stream is open.
            _frame_buffer.append(_preprocess_behavior_frame(frame))

            if frame_id % DETECT_EVERY_N_FRAMES == 0:
                detections, fish_count = _run_fish_detection_and_disease(frame)

                with _detection_lock:
                    _cached_detections = detections
                    _cached_fish_count = fish_count
            else:
                with _detection_lock:
                    detections = list(_cached_detections)
                    fish_count = _cached_fish_count

            frame = _draw_disease_overlay(frame, detections, fish_count)

            yield _mjpeg_frame(frame)

            elapsed = time.time() - loop_start
            sleep_time = max(0.0, frame_delay - elapsed)
            time.sleep(sleep_time)

    except GeneratorExit:
        pass
    except Exception as e:
        print(f"Disease stream error: {e}")
    finally:
        cap.release()


def _generate_behavior_frames(camera_idx: int):
    _load_models()
    _ensure_behavior_thread()

    cap = _open_camera(camera_idx)

    frame_id = 0
    frame_delay = 1.0 / TARGET_FPS

    global _cached_detections, _cached_fish_count

    try:
        while True:
            loop_start = time.time()

            ok, frame = cap.read()

            if not ok or frame is None:
                time.sleep(0.03)
                continue

            frame_id += 1

            _frame_buffer.append(_preprocess_behavior_frame(frame))

            # Behavior stream still needs fish boxes for count/context.
            # But it does NOT run disease classification.
            if frame_id % DETECT_EVERY_N_FRAMES == 0 and _fish_detector is not None:
                detections, fish_count = _run_fish_detection_only(frame)

                with _detection_lock:
                    _cached_detections = detections
                    _cached_fish_count = fish_count
            else:
                with _detection_lock:
                    detections = list(_cached_detections)
                    fish_count = _cached_fish_count

            frame = _draw_behavior_overlay(frame, detections, fish_count)

            yield _mjpeg_frame(frame)

            elapsed = time.time() - loop_start
            sleep_time = max(0.0, frame_delay - elapsed)
            time.sleep(sleep_time)

    except GeneratorExit:
        pass
    except Exception as e:
        print(f"Behavior stream error: {e}")
    finally:
        cap.release()


def _run_fish_detection_only(frame: np.ndarray) -> tuple[list[dict[str, Any]], int]:
    if _fish_detector is None:
        return [], 0

    h_frame, w_frame = frame.shape[:2]

    try:
        result = _fish_detector(
            frame,
            conf=FISH_CONF,
            iou=FISH_IOU,
            imgsz=FISH_IMGSZ,
            verbose=False,
        )[0]

        detections = []

        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            det_conf = float(box.conf)

            x1 = max(0, min(x1, w_frame - 1))
            x2 = max(0, min(x2, w_frame - 1))
            y1 = max(0, min(y1, h_frame - 1))
            y2 = max(0, min(y2, h_frame - 1))

            bw = x2 - x1
            bh = y2 - y1

            if bw < 15 or bh < 15:
                continue

            detections.append(
                {
                    "id": len(detections) + 1,
                    "box": [x1, y1, x2, y2],
                    "det_conf": det_conf,
                    "disease_label": "Not checked",
                    "disease_conf": 0.0,
                    "is_alert": False,
                }
            )

        return detections, len(detections)

    except Exception as e:
        print(f"Fish detection only error: {e}")
        return [], 0


# ============================================================
# HTML PAGES
# ============================================================
def _stream_page(title: str, stream_url: str, subtitle: str) -> str:
    return f"""
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>{title}</title>
    <style>
        body {{
            margin: 0;
            background: #050505;
            color: #f5f5f5;
            font-family: Arial, sans-serif;
        }}
        header {{
            padding: 14px 20px;
            background: #111;
            border-bottom: 1px solid #333;
        }}
        h1 {{
            margin: 0;
            font-size: 22px;
        }}
        p {{
            margin: 6px 0 0 0;
            color: #aaa;
            font-size: 14px;
        }}
        .wrap {{
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: calc(100vh - 80px);
        }}
        img {{
            max-width: 100vw;
            max-height: calc(100vh - 90px);
            object-fit: contain;
            background: #000;
        }}
        nav {{
            margin-top: 8px;
        }}
        a {{
            color: #73b7ff;
            margin-right: 16px;
            text-decoration: none;
        }}
    </style>
</head>
<body>
    <header>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <nav>
            <a href="/camera/live">Disease Stream</a>
            <a href="/camera/behavior">Behavior Stream</a>
            <a href="/camera/status">Status JSON</a>
        </nav>
    </header>
    <div class="wrap">
        <img src="{stream_url}" />
    </div>
</body>
</html>
"""


@router.get("/camera/live", response_class=HTMLResponse)
def camera_live_page(index: int = Query(CAMERA_INDEX)):
    return HTMLResponse(
        _stream_page(
            title="Fishlinic Live Disease Analysis",
            stream_url=f"/camera/live/stream?index={index}",
            subtitle="Fish counting + confirmed disease alerts. Healthy fish boxes are hidden for a cleaner demo.",
        )
    )


@router.get("/camera/behavior", response_class=HTMLResponse)
def camera_behavior_page(index: int = Query(CAMERA_INDEX)):
    return HTMLResponse(
        _stream_page(
            title="Fishlinic Live Behavior Analysis",
            stream_url=f"/camera/behavior/stream?index={index}",
            subtitle="Whole-tank behavior classification with fish-count context.",
        )
    )


# ============================================================
# STREAM ROUTES
# ============================================================
@router.get("/camera/live/stream")
def camera_live_stream(index: int = Query(CAMERA_INDEX)):
    return StreamingResponse(
        _generate_disease_frames(index),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/camera/behavior/stream")
def camera_behavior_stream(index: int = Query(CAMERA_INDEX)):
    return StreamingResponse(
        _generate_behavior_frames(index),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


# ============================================================
# STATUS ROUTE
# ============================================================
@router.get("/camera/status")
def camera_status():
    _load_models()

    with _behavior_lock:
        behavior = dict(_behavior_result)

    with _detection_lock:
        detections = list(_cached_detections)
        fish_count = _cached_fish_count

    return JSONResponse(
        {
            "fish_detector": _fish_detector is not None,
            "fish_detector_path": str(_fish_detector_path)
            if _fish_detector_path.exists()
            else str(_fish_detector_fallback_path),
            "disease_model": _disease_cls is not None,
            "disease_classifier_path": str(_disease_classifier_path),
            "disease_classes": getattr(_disease_cls, "names", None)
            if _disease_cls is not None
            else None,
            "behavior_model": _behavior_model is not None,
            "behavior_model_path": str(_behavior_model_path),
            "behavior_classes": _behavior_classes,
            "device": _device,
            "fish_count": fish_count,
            "detections": detections,
            "behavior": behavior,
            "camera_index": CAMERA_INDEX,
            "thresholds": {
                "fish_conf": FISH_CONF,
                "fish_iou": FISH_IOU,
                "disease_alert_conf": DISEASE_ALERT_CONF,
                "detect_every_n_frames": DETECT_EVERY_N_FRAMES,
            },
        }
    )