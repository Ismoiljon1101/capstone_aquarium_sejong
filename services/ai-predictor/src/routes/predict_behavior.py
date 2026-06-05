from __future__ import annotations

import json
import os
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn as nn
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from torchvision.models.video import r3d_18

router = APIRouter()

_repo_root = Path(__file__).resolve().parents[4]
_model_dir = Path(
    os.getenv(
        "BEHAVIOR_MODEL_DIR",
        _repo_root / "models" / "behavior_video_classifier",
    )
)
_model_path = _model_dir / "best_model.pth"
_classes_path = _model_dir / "classes.json"

NUM_FRAMES = 16
FRAME_SIZE = 112
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MEAN = np.array([0.43216, 0.394666, 0.37645], dtype=np.float32).reshape(3, 1, 1)
STD = np.array([0.22803, 0.22145, 0.216989], dtype=np.float32).reshape(3, 1, 1)

_classes: list[str] = []
_model: torch.nn.Module | None = None
_load_error: str | None = None


def _build_model(num_classes: int) -> torch.nn.Module:
    model = r3d_18(weights=None)
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(model.fc.in_features, num_classes),
    )
    return model


def _load_model() -> tuple[torch.nn.Module | None, list[str], str | None]:
    global _classes, _model, _load_error

    if _model is not None or _load_error is not None:
      return _model, _classes, _load_error

    try:
        if not _model_path.exists():
            raise FileNotFoundError(f"Behavior model not found: {_model_path}")
        if not _classes_path.exists():
            raise FileNotFoundError(f"Behavior classes not found: {_classes_path}")

        with _classes_path.open("r", encoding="utf-8") as f:
            _classes = json.load(f)

        model = _build_model(len(_classes))
        state_dict = torch.load(_model_path, map_location=DEVICE)
        model.load_state_dict(state_dict)
        model.to(DEVICE)
        model.eval()
        _model = model
    except Exception as exc:
        _load_error = str(exc)

    return _model, _classes, _load_error


def _sample_video_frames(video_path: Path) -> torch.Tensor:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        cap.release()
        raise RuntimeError(f"Video has no readable frames: {video_path}")

    indices = np.linspace(0, max(total_frames - 1, 0), NUM_FRAMES, dtype=int)
    frames: list[np.ndarray] = []
    last_frame: np.ndarray | None = None

    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ok, frame = cap.read()
        if not ok:
            if last_frame is None:
                continue
            frame = last_frame

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame_resized = cv2.resize(frame_rgb, (FRAME_SIZE, FRAME_SIZE), interpolation=cv2.INTER_LINEAR)
        frame_float = frame_resized.astype(np.float32) / 255.0
        frame_chw = np.transpose(frame_float, (2, 0, 1))
        frame_norm = (frame_chw - MEAN) / STD
        frames.append(frame_norm)
        last_frame = frame

    cap.release()

    if not frames:
        raise RuntimeError("No frames could be decoded from the video stream.")

    while len(frames) < NUM_FRAMES:
        frames.append(frames[-1])

    video = np.stack(frames[:NUM_FRAMES], axis=1)  # (C, T, H, W)
    return torch.from_numpy(video).unsqueeze(0).to(DEVICE)


def _describe_label(label: str) -> tuple[str, str]:
    descriptions = {
        "normal_swimming": (
            "ok",
            "Fish show stable, normal swimming activity.",
        ),
        "feeding_response": (
            "ok",
            "Fish are actively responding as if food stimulus is present.",
        ),
        "erratic_or_chasing": (
            "warn",
            "Fish movement looks erratic or overly reactive and should be monitored.",
        ),
        "lethargic_low_activity": (
            "warn",
            "Fish activity is unusually low and may indicate stress or weakness.",
        ),
    }
    return descriptions.get(label, ("warn", f"Detected behavior: {label}."))


class BehaviorRequest(BaseModel):
    videoPath: str | None = None
    imagePath: str | None = None


@router.post("/predict/behavior")
def predict_behavior(req: BehaviorRequest):
    model, classes, load_error = _load_model()
    if load_error:
        raise HTTPException(status_code=503, detail=f"Behavior model unavailable: {load_error}")
    if model is None or not classes:
        raise HTTPException(status_code=503, detail="Behavior model is not loaded.")

    if not req.videoPath:
        raise HTTPException(status_code=400, detail="videoPath is required for video-based behavior prediction.")

    video_path = Path(req.videoPath)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail=f"Video not found: {video_path}")

    try:
        video_tensor = _sample_video_frames(video_path)
        with torch.no_grad():
            logits = model(video_tensor)
            probabilities = torch.softmax(logits, dim=1)[0]

        best_index = int(torch.argmax(probabilities).item())
        confidence = float(probabilities[best_index].item())
        label = classes[best_index]
        status, description = _describe_label(label)

        top_scores = sorted(
            (
                {
                    "label": classes[i],
                    "confidence": round(float(probabilities[i].item()), 4),
                }
                for i in range(len(classes))
            ),
            key=lambda item: item["confidence"],
            reverse=True,
        )[:3]

        return {
            "label": label,
            "confidence": round(confidence, 4),
            "status": status,
            "abnormal": status != "ok",
            "description": description,
            "topPredictions": top_scores,
            "videoPath": str(video_path),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Behavior prediction failed: {exc}") from exc