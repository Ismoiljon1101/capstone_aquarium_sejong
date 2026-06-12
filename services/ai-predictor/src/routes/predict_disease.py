# predict_disease.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os, cv2, sqlite3, numpy as np
from datetime import datetime

router = APIRouter()

# ── Paths ──────────────────────────────────────────────────────────────────────
_repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
model_path = os.path.join(_repo_root, "models", "disease", "yolo_disease.pt")
db_path    = os.path.join(_repo_root, "services", "backend", "fishlinic.sqlite")

# ── Model loading (lazy) ───────────────────────────────────────────────────────
yolo_model = None
load_error = None

def get_model():
    global yolo_model, load_error
    if yolo_model is not None or load_error is not None:
        return yolo_model
    try:
        from ultralytics import YOLO
        yolo_model = YOLO(model_path)
        print(f"[Disease] Model loaded from {model_path}")
    except Exception as e:
        load_error = str(e)
        print(f"[Disease] Model load failed: {e}")
    return yolo_model

# ── DB setup ───────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def ensure_disease_table():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS disease_detections (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT NOT NULL,
            source      TEXT,
            disease     TEXT NOT NULL,
            confidence  REAL NOT NULL,
            bbox_x1     INTEGER,
            bbox_y1     INTEGER,
            bbox_x2     INTEGER,
            bbox_y2     INTEGER,
            is_alert    INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

ensure_disease_table()

# ── Helpers ────────────────────────────────────────────────────────────────────
ALERT_DISEASES = {"BD", "PD", "FD"}   # Bacterial, Parasitic, Fungal

def is_alert(disease_label: str) -> bool:
    prefix = disease_label.split()[0].upper() if disease_label else ""
    return prefix in ALERT_DISEASES

def log_detections(detections: list):
    if not detections:
        return
    conn = get_db()
    conn.executemany("""
        INSERT INTO disease_detections
            (timestamp, source, disease, confidence, bbox_x1, bbox_y1, bbox_x2, bbox_y2, is_alert)
        VALUES
            (:timestamp, :source, :disease, :confidence, :bbox_x1, :bbox_y1, :bbox_x2, :bbox_y2, :is_alert)
    """, detections)
    conn.commit()
    conn.close()

def run_detection(image, source: str) -> list:
    """Run YOLO on a numpy frame, return list of detection dicts."""
    loaded_model = get_model()
    if loaded_model is None:
        return []

    results = loaded_model(image, verbose=False)[0]
    detections = []

    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        label      = loaded_model.names[int(box.cls)]
        confidence = round(float(box.conf), 4)
        alert      = is_alert(label)

        detections.append({
            "timestamp":  datetime.utcnow().isoformat(),
            "source":     source,
            "disease":    label,
            "confidence": confidence,
            "bbox_x1":    x1,
            "bbox_y1":    y1,
            "bbox_x2":    x2,
            "bbox_y2":    y2,
            "is_alert":   int(alert),
        })

    return detections

# ── Request models ─────────────────────────────────────────────────────────────
class ImageRequest(BaseModel):
    imagePath: str

class VideoRequest(BaseModel):
    videoPath: str
    maxFrames: int = 300
    frameSkip:  int = 5

# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/predict/disease")
def predict_disease_image(req: ImageRequest):
    """Run disease detection on a single image file."""
    if get_model() is None:
        raise HTTPException(status_code=503, detail=f"Disease model unavailable: {load_error}")

    if not os.path.exists(req.imagePath):
        raise HTTPException(status_code=404, detail=f"Image not found: {req.imagePath}")

    frame = cv2.imread(req.imagePath)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not read image")

    detections = run_detection(frame, source=req.imagePath)
    log_detections(detections)

    if not detections:
        return {"status": "ok", "detections": [], "summary": "no_fish_detected"}

    alerts = [d for d in detections if d["is_alert"]]
    return {
        "status":     "ok",
        "detections": detections,
        "total":      len(detections),
        "alerts":     len(alerts),
        "summary":    "alert" if alerts else "healthy",
    }


@router.post("/predict/disease/video")
def predict_disease_video(req: VideoRequest):
    """Run disease detection across video frames."""
    if get_model() is None:
        raise HTTPException(status_code=503, detail=f"Disease model unavailable: {load_error}")

    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")

    cap = cv2.VideoCapture(req.videoPath)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Could not open video")

    all_detections = []
    frame_index = 0
    processed   = 0

    while processed < req.maxFrames:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_index % req.frameSkip == 0:
            detections = run_detection(frame, source=f"{req.videoPath}@frame{frame_index}")
            all_detections.extend(detections)
            processed += 1
        frame_index += 1

    cap.release()
    log_detections(all_detections)

    alerts    = [d for d in all_detections if d["is_alert"]]
    diseases  = list({d["disease"] for d in all_detections})

    return {
        "status":           "ok",
        "frames_processed": processed,
        "total_detections": len(all_detections),
        "alert_count":      len(alerts),
        "diseases_found":   diseases,
        "summary":          "alert" if alerts else ("healthy" if all_detections else "no_fish_detected"),
    }


@router.get("/disease/history")
def get_disease_history(limit: int = 100):
    """Return recent disease detections from DB."""
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM disease_detections
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return {"data": [dict(r) for r in rows]}


@router.get("/disease/alerts")
def get_disease_alerts(limit: int = 50):
    """Return only alert-level disease detections."""
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM disease_detections
        WHERE is_alert = 1
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return {"alerts": [dict(r) for r in rows]}


@router.get("/disease/stats")
def get_disease_stats():
    """Return disease detection statistics."""
    conn = get_db()
    total     = conn.execute("SELECT COUNT(*) FROM disease_detections").fetchone()[0]
    alerts    = conn.execute("SELECT COUNT(*) FROM disease_detections WHERE is_alert=1").fetchone()[0]
    by_disease = conn.execute("""
        SELECT disease, COUNT(*) as count
        FROM disease_detections
        GROUP BY disease
        ORDER BY count DESC
    """).fetchall()
    conn.close()
    return {
        "total_detections": total,
        "total_alerts":     alerts,
        "by_disease":       [dict(r) for r in by_disease],
    }
