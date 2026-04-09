# predict_behavior.py
from fastapi import APIRouter
from pydantic import BaseModel
import torch, os
import numpy as np

router = APIRouter()
model_path = os.getenv("MODEL_PATH", "../../resources/models") + "/convlstm_vae.pt"
# Model loading with fail-safe for local testing
try:
    model = torch.load(model_path, map_location="cpu")
    model.eval()
except Exception:
    model = None

class BehaviorRequest(BaseModel):
    imagePath: str

@router.post("/predict/behavior")
def predict_behavior(req: BehaviorRequest):
    # Returns anomaly flag — full frame sequence logic owned by Firdavs
    return { "anomaly": False, "score": 0.0, "description": "normal" }
