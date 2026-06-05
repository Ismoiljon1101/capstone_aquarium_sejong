from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path

import cv2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_repo_root = Path(__file__).resolve().parents[4]
_output_dir = Path(
    os.getenv(
        "CAMERA_CAPTURE_OUTPUT_DIR",
        _repo_root / "outputs" / "camera_captures",
    )
)
_stream_url = os.getenv("CAMERA_STREAM_URL") or os.getenv("CAMERA_API")
_capture_frames = max(16, int(os.getenv("CAMERA_CAPTURE_FRAMES", "32")))
_warmup_frames = max(0, int(os.getenv("CAMERA_WARMUP_FRAMES", "8")))
_max_attempts = max(_capture_frames + _warmup_frames, int(os.getenv("CAMERA_MAX_READ_ATTEMPTS", "80")))
_fps = max(1.0, float(os.getenv("CAMERA_CAPTURE_FPS", "12")))


class CameraCaptureRequest(BaseModel):
    triggeredBy: str | None = "MANUAL"


@router.post("/camera/capture")
def capture_camera_clip(req: CameraCaptureRequest):
    if not _stream_url:
        raise HTTPException(status_code=503, detail="CAMERA_STREAM_URL is not configured.")

    _output_dir.mkdir(parents=True, exist_ok=True)
    captured_at = datetime.utcnow()
    stamp = captured_at.strftime("%Y%m%d_%H%M%S")
    video_path = _output_dir / f"{stamp}.mp4"
    image_path = _output_dir / f"{stamp}.jpg"

    cap = cv2.VideoCapture(_stream_url)
    if not cap.isOpened():
        raise HTTPException(status_code=503, detail=f"Could not open camera stream: {_stream_url}")

    frames = []
    attempts = 0
    skipped = 0

    try:
        while len(frames) < _capture_frames and attempts < _max_attempts:
            attempts += 1
            ok, frame = cap.read()
            if not ok or frame is None:
                continue

            if skipped < _warmup_frames:
                skipped += 1
                continue

            frames.append(frame.copy())
    finally:
        cap.release()

    if len(frames) < 16:
        raise HTTPException(
            status_code=504,
            detail=f"Camera stream yielded only {len(frames)} usable frames; need at least 16.",
        )

    height, width = frames[0].shape[:2]
    writer = cv2.VideoWriter(
        str(video_path),
        cv2.VideoWriter_fourcc(*"mp4v"),
        _fps,
        (width, height),
    )

    try:
        for frame in frames:
            writer.write(frame)
    finally:
        writer.release()

    key_frame = frames[len(frames) // 2]
    if not cv2.imwrite(str(image_path), key_frame):
        raise HTTPException(status_code=500, detail=f"Failed to write snapshot image: {image_path}")

    return {
        "triggeredBy": req.triggeredBy or "MANUAL",
        "capturedAt": captured_at.isoformat() + "Z",
        "frameCount": len(frames),
        "imagePath": str(image_path),
        "videoPath": str(video_path),
    }
