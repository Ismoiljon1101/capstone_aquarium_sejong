# predict_quality.py
from fastapi import APIRouter
from pydantic import BaseModel
import pickle, os, numpy as np

router = APIRouter()
model_path = os.getenv("MODEL_PATH", "../../resources/models") + "/rf_quality.pkl"
with open(model_path, "rb") as f:
    model = pickle.load(f)

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
