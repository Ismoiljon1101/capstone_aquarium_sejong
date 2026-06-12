from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os

router = APIRouter()

_repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
model_path = os.path.join(_repo_root, "models", "disease", "yolo_disease.pt")

model = None
load_error = None

def get_model():
    global model, load_error
    if model is not None or load_error is not None:
        return model
    try:
        from ultralytics import YOLO
        model = YOLO(model_path)
        print(f"[Count] Model loaded from {model_path}")
    except Exception as e:
        load_error = str(e)
    return model

class ImageRequest(BaseModel):
    imagePath: str

@router.post("/predict/count")
def count_fish(req: ImageRequest):
    loaded_model = get_model()
    if loaded_model is None:
        raise HTTPException(status_code=503, detail=f"Count model unavailable: {load_error}")
    if not os.path.exists(req.imagePath):
        raise HTTPException(status_code=404, detail=f"Image not found: {req.imagePath}")
    results = loaded_model(req.imagePath, verbose=False)
    count = len(results[0].boxes)
    confidence = float(sum(b.conf for b in results[0].boxes) / max(count, 1))
    return { "count": count, "confidence": round(confidence, 3), "timestamp": __import__('datetime').datetime.utcnow().isoformat() }
