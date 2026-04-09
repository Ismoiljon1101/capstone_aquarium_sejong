# predict_disease.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO
import os

router = APIRouter()
model_path = os.getenv("MODEL_PATH", "../../resources/models") + "/yolo_disease.pt"
model = None
try:
    model = YOLO(model_path)
except Exception as e:
    print(f"Warning: Could not load disease model: {e}")

class ImageRequest(BaseModel):
    imagePath: str

@router.post("/predict/disease")
def predict_disease(req: ImageRequest):
    results = model(req.imagePath)
    detections = results[0].boxes
    if len(detections) == 0:
        return { "disease": "none", "confidence": 1.0, "bbox": [] }
    box = detections[0]
    label = model.names[int(box.cls)]
    confidence = float(box.conf)
    return { "disease": label, "confidence": confidence, "bbox": box.xyxy[0].tolist() }
