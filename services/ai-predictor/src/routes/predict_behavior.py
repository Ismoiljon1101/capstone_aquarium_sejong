# predict_behavior.py
from fastapi import APIRouter
from pydantic import BaseModel
import torch, os
import numpy as np

router = APIRouter()
_repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
model_path = os.path.join(os.getenv("MODEL_PATH", os.path.join(_repo_root, "resources", "models")), "convlstm_vae.pth")
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
