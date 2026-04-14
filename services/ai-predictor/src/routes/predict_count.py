# predict_count.py
from fastapi import APIRouter
from pydantic import BaseModel
from ultralytics import YOLO
import os

router = APIRouter()
_repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
model_path = os.path.join(os.getenv("MODEL_PATH", os.path.join(_repo_root, "resources", "models")), "yolo_count.pt")
model = None
try:
    model = YOLO(model_path)
except Exception as e:
    print(f"Warning: Could not load count model: {e}")

class ImageRequest(BaseModel):
    imagePath: str

@router.post("/predict/count")
def count_fish(req: ImageRequest):
    results = model(req.imagePath)
    count = len(results[0].boxes)
    confidence = float(sum(b.conf for b in results[0].boxes) / max(count, 1))
    return { "count": count, "confidence": round(confidence, 3) }
