# predict_quality.py
from fastapi import APIRouter
from pydantic import BaseModel
import pickle, os, numpy as np

router = APIRouter()
_repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
model_path = os.path.join(os.getenv("MODEL_PATH", os.path.join(_repo_root, "resources", "models")), "rf_quality.pkl")
model = None
try:
    with open(model_path, "rb") as f:
        model = pickle.load(f)
except Exception as e:
    print(f"Warning: Could not load quality model: {e}")

class WaterReading(BaseModel):
    pH: float
    temp_c: float
    do_mg_l: float

@router.post("/predict/quality")
def predict_quality(reading: WaterReading):
    # Using exactly these 3 features as per Correction 5
    features = np.array([[reading.pH, reading.temp_c, reading.do_mg_l]])
    score = float(model.predict(features)[0])
    status = "ok" if score >= 70 else "warn" if score >= 40 else "critical"
    return { "score": round(score, 2), "status": status }
