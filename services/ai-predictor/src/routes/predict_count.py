# predict_count.py
from fastapi import APIRouter
from pydantic import BaseModel
from ultralytics import YOLO
import os

router = APIRouter()
model_path = os.getenv("MODEL_PATH", "../../resources/models") + "/yolo_disease.pt"
model = YOLO(model_path)

class ImageRequest(BaseModel):
    imagePath: str

@router.post("/predict/count")
def count_fish(req: ImageRequest):
    results = model(req.imagePath)
    count = len(results[0].boxes)
    confidence = float(sum(b.conf for b in results[0].boxes) / max(count, 1))
    return { "count": count, "confidence": round(confidence, 3) }
