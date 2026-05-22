from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

class WaterReading(BaseModel):
    pH: float
    temp_c: float
    do_mg_l: float

class AnomalyRequest(BaseModel):
    readings: List[WaterReading]

model = None

@router.post("/predict/anomaly")
def predict_anomaly(req: AnomalyRequest):
    if model is None:
        return { "anomaly_score": 0.0, "is_anomaly": False, "threshold": 0.5, "note": "model not loaded" }
