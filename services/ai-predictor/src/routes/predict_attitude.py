from fastapi import APIRouter
from fastapi import HTTPException
from pydantic import BaseModel
import cv2
import numpy as np
import os
import sqlite3
from datetime import datetime

router = APIRouter()

_repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
model_path = os.path.join(
    os.getenv("MODEL_PATH", os.path.join(_repo_root, "models", "behavior")),
    "yolo11n.pt"
)
db_path = os.path.join(_repo_root, "services", "backend", "fishlinic.sqlite")

yolo_model = None
load_error = None


def get_model():
    global yolo_model, load_error
    if yolo_model is not None or load_error is not None:
        return yolo_model
    try:
        from ultralytics import YOLO
        yolo_model = YOLO(model_path)
    except Exception as exc:
        load_error = str(exc)
    return yolo_model

# ── DB setup ──────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def ensure_attitude_table():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS attitude_detections (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp       TEXT NOT NULL,
            frame_index     INTEGER,
            region          TEXT,
            swim_angle      REAL,
            aspect_ratio    REAL,
            tilt_severity   TEXT,
            anomaly_score   REAL,
            bbox_x          INTEGER,
            bbox_y          INTEGER,
            bbox_w          INTEGER,
            bbox_h          INTEGER
        )
    """)
    conn.commit()
    conn.close()

ensure_attitude_table()

# ── Core attitude math ────────────────────────────────────────────────────────

def get_region(cx, cy, frame_w, frame_h):
    col = "left" if cx < frame_w / 3 else ("center" if cx < 2 * frame_w / 3 else "right")
    row = "top" if cy < frame_h / 2 else "bottom"
    return f"{row}_{col}"

def compute_swim_angle(bbox_w, bbox_h):
    """
    Estimate swim angle from bounding box aspect ratio.
    A flat fish has wide bbox (low angle).
    A tilted/vertical fish has taller bbox (high angle).
    Returns angle in degrees (0 = horizontal, 90 = vertical).
    """
    if bbox_w == 0:
        return 90.0
    ratio = bbox_h / bbox_w
    angle = float(np.degrees(np.arctan(ratio)))
    return round(angle, 2)

def classify_tilt(angle, aspect_ratio):
    if angle < 35:        # was 20 — reef fish swim steeper
        return "normal", 0.0
    elif angle < 55:      # was 40
        return "mild_tilt", 0.3
    elif angle < 70:      # was 60
        return "moderate_tilt", 0.6
    else:
        return "severe_tilt", 1.0

def analyze_frame_attitude(frame, frame_index):
    loaded_model = get_model()
    if loaded_model is None:
        return []

    frame_h, frame_w = frame.shape[:2]
    results = loaded_model(frame, verbose=False)[0]
    detections = []

    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        bbox_w = x2 - x1
        bbox_h = y2 - y1
        cx = x1 + bbox_w // 2
        cy = y1 + bbox_h // 2

        angle = compute_swim_angle(bbox_w, bbox_h)
        aspect_ratio = round(bbox_h / bbox_w if bbox_w > 0 else 0, 3)
        tilt_severity, anomaly_score = classify_tilt(angle, aspect_ratio)
        region = get_region(cx, cy, frame_w, frame_h)

        detection = {
            "timestamp": datetime.utcnow().isoformat(),
            "frame_index": frame_index,
            "region": region,
            "swim_angle": angle,
            "aspect_ratio": aspect_ratio,
            "tilt_severity": tilt_severity,
            "anomaly_score": anomaly_score,
            "bbox_x": x1,
            "bbox_y": y1,
            "bbox_w": bbox_w,
            "bbox_h": bbox_h,
        }
        detections.append(detection)

    return detections

def log_to_db(detections):
    if not detections:
        return
    conn = get_db()
    conn.executemany("""
        INSERT INTO attitude_detections
            (timestamp, frame_index, region, swim_angle, aspect_ratio,
             tilt_severity, anomaly_score, bbox_x, bbox_y, bbox_w, bbox_h)
        VALUES
            (:timestamp, :frame_index, :region, :swim_angle, :aspect_ratio,
             :tilt_severity, :anomaly_score, :bbox_x, :bbox_y, :bbox_w, :bbox_h)
    """, detections)
    conn.commit()
    conn.close()

# ── Routes ────────────────────────────────────────────────────────────────────

class AttitudeRequest(BaseModel):
    videoPath: str
    maxFrames: int = 300        # ~10s at 30fps by default
    frameSkip: int = 5          # process every 5th frame for speed

@router.post("/predict/attitude")
def predict_attitude(req: AttitudeRequest):
    if get_model() is None:
        raise HTTPException(status_code=503, detail=f"Attitude model unavailable: {load_error}")
    if not os.path.exists(req.videoPath):
        return {"error": f"Video not found: {req.videoPath}"}

    cap = cv2.VideoCapture(req.videoPath)
    if not cap.isOpened():
        return {"error": "Could not open video"}

    all_detections = []
    frame_index = 0
    processed = 0
    alert_frames = []

    while processed < req.maxFrames:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_index % req.frameSkip == 0:
            detections = analyze_frame_attitude(frame, frame_index)
            all_detections.extend(detections)

            severe = [d for d in detections if d["tilt_severity"] == "severe_tilt"]
            if severe:
                alert_frames.append({
                    "frame": frame_index,
                    "count": len(severe),
                    "region": severe[0]["region"]
                })
            processed += 1

        frame_index += 1

    cap.release()
    log_to_db(all_detections)

    total = len(all_detections)
    abnormal = [d for d in all_detections if d["tilt_severity"] != "normal"]
    avg_angle = round(np.mean([d["swim_angle"] for d in all_detections]), 2) if all_detections else 0.0

    return {
        "status": "ok",
        "frames_processed": processed,
        "total_detections": total,
        "abnormal_detections": len(abnormal),
        "avg_swim_angle": avg_angle,
        "alert_frames": alert_frames[:10],
        "summary": "normal" if len(abnormal) == 0 else (
            "mild_concern" if len(abnormal) < total * 0.2 else "needs_attention"
        )
    }

@router.get("/attitude/history")
def get_attitude_history(limit: int = 100):
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM attitude_detections
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return {"data": [dict(r) for r in rows]}

@router.get("/attitude/alerts")
def get_attitude_alerts():
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM attitude_detections
        WHERE tilt_severity IN ('moderate_tilt', 'severe_tilt')
        ORDER BY timestamp DESC
        LIMIT 50
    """).fetchall()
    conn.close()
    return {"alerts": [dict(r) for r in rows]}
