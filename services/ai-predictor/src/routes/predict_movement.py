from fastapi import APIRouter
from fastapi import HTTPException
from pydantic import BaseModel
import cv2
import numpy as np
import os
import sqlite3
from datetime import datetime
from collections import defaultdict

router = APIRouter()

_repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
model_path = os.path.join(
    os.getenv("MODEL_PATH", os.path.join(_repo_root, "models", "disease")),
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

def ensure_movement_table():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS movement_detections (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp           TEXT NOT NULL,
            frame_index         INTEGER,
            region              TEXT,
            centroid_x          REAL,
            centroid_y          REAL,
            speed_px            REAL,
            direction_degrees   REAL,
            drift_ratio         REAL,
            movement_type       TEXT,
            anomaly_score       REAL
        )
    """)
    conn.commit()
    conn.close()

ensure_movement_table()

# ── Core movement math ────────────────────────────────────────────────────────

def get_region(cx, cy, frame_w, frame_h):
    col = "left" if cx < frame_w / 3 else ("center" if cx < 2 * frame_w / 3 else "right")
    row = "top" if cy < frame_h / 2 else "bottom"
    return f"{row}_{col}"

def compute_direction(dx, dy):
    """Convert delta x/y to compass angle in degrees (0=right, 90=up, 180=left, 270=down)."""
    angle = float(np.degrees(np.arctan2(-dy, dx))) % 360
    return round(angle, 2)

def compute_drift_ratio(direction_history):
    """
    Drift ratio: how consistent is direction across recent frames.
    0.0 = actively changing direction (healthy)
    1.0 = moving in one direction without changing (drifting/sick)
    """
    if len(direction_history) < 3:
        return 0.0
    deltas = [abs(direction_history[i] - direction_history[i-1]) % 360
              for i in range(1, len(direction_history))]
    deltas = [d if d <= 180 else 360 - d for d in deltas]
    avg_change = np.mean(deltas)
    drift = 1.0 - min(avg_change / 90.0, 1.0)
    return round(float(drift), 3)

def classify_movement(speed, drift_ratio):
    if speed < 3.0:          # was 1.5
        return "stationary", 0.7
    elif speed < 6.0 and drift_ratio > 0.8:   # was 4.0
        return "drifting", 0.8
    elif speed > 60.0:       # was 40.0
        return "erratic", 0.6
    else:
        return "active_swim", 0.0

def log_to_db(records):
    if not records:
        return
    conn = get_db()
    conn.executemany("""
        INSERT INTO movement_detections
            (timestamp, frame_index, region, centroid_x, centroid_y,
             speed_px, direction_degrees, drift_ratio, movement_type, anomaly_score)
        VALUES
            (:timestamp, :frame_index, :region, :centroid_x, :centroid_y,
             :speed_px, :direction_degrees, :drift_ratio, :movement_type, :anomaly_score)
    """, records)
    conn.commit()
    conn.close()

# ── Routes ────────────────────────────────────────────────────────────────────

class MovementRequest(BaseModel):
    videoPath: str
    maxFrames: int = 300
    frameSkip: int = 5
    fps: float = 30.0

@router.post("/predict/movement")
def predict_movement(req: MovementRequest):
    if get_model() is None:
        raise HTTPException(status_code=503, detail=f"Movement model unavailable: {load_error}")
    if not os.path.exists(req.videoPath):
        return {"error": f"Video not found: {req.videoPath}"}

    cap = cv2.VideoCapture(req.videoPath)
    if not cap.isOpened():
        return {"error": "Could not open video"}

    frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))

    # Track centroid history per region
    region_centroids = defaultdict(list)
    region_directions = defaultdict(list)

    all_records = []
    frame_index = 0
    processed = 0
    alerts = []

    prev_centroids = {}   # region -> (cx, cy) from previous frame

    while processed < req.maxFrames:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_index % req.frameSkip == 0:
            loaded_model = get_model()
            if loaded_model is not None:
                results = loaded_model(frame, verbose=False)[0]

                current_centroids = {}
                for box in results.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cx = (x1 + x2) / 2
                    cy = (y1 + y2) / 2
                    region = get_region(cx, cy, frame_w, frame_h)

                    # Use region as tracking key (matches your existing region-based approach)
                    if region not in current_centroids:
                        current_centroids[region] = (cx, cy)

                for region, (cx, cy) in current_centroids.items():
                    speed = 0.0
                    direction = 0.0
                    drift_ratio = 0.0

                    if region in prev_centroids:
                        px, py = prev_centroids[region]
                        dx = cx - px
                        dy = cy - py
                        speed = round(float(np.sqrt(dx**2 + dy**2)), 3)
                        direction = compute_direction(dx, dy)
                        region_directions[region].append(direction)
                        drift_ratio = compute_drift_ratio(region_directions[region][-10:])

                    movement_type, anomaly_score = classify_movement(speed, drift_ratio)

                    record = {
                        "timestamp": datetime.utcnow().isoformat(),
                        "frame_index": frame_index,
                        "region": region,
                        "centroid_x": round(cx, 2),
                        "centroid_y": round(cy, 2),
                        "speed_px": speed,
                        "direction_degrees": direction,
                        "drift_ratio": drift_ratio,
                        "movement_type": movement_type,
                        "anomaly_score": anomaly_score,
                    }
                    all_records.append(record)

                    if movement_type in ("stationary", "drifting"):
                        alerts.append({
                            "frame": frame_index,
                            "region": region,
                            "type": movement_type,
                            "speed": speed,
                            "drift_ratio": drift_ratio
                        })

                prev_centroids = current_centroids
            processed += 1

        frame_index += 1

    cap.release()
    log_to_db(all_records)

    total = len(all_records)
    abnormal = [r for r in all_records if r["movement_type"] != "active_swim"]
    avg_speed = round(np.mean([r["speed_px"] for r in all_records]), 2) if all_records else 0.0
    avg_drift = round(np.mean([r["drift_ratio"] for r in all_records]), 3) if all_records else 0.0

    return {
        "status": "ok",
        "frames_processed": processed,
        "total_detections": total,
        "abnormal_detections": len(abnormal),
        "avg_speed_px": avg_speed,
        "avg_drift_ratio": avg_drift,
        "alerts": alerts[:10],
        "summary": "normal" if len(abnormal) == 0 else (
            "mild_concern" if len(abnormal) < total * 0.2 else "needs_attention"
        )
    }

@router.get("/movement/history")
def get_movement_history(limit: int = 100):
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM movement_detections
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return {"data": [dict(r) for r in rows]}

@router.get("/movement/alerts")
def get_movement_alerts():
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM movement_detections
        WHERE movement_type IN ('stationary', 'drifting', 'erratic')
        ORDER BY timestamp DESC
        LIMIT 50
    """).fetchall()
    conn.close()
    return {"alerts": [dict(r) for r in rows]}
