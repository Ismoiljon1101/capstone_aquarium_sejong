# predict_quality.py
from fastapi import APIRouter
from pydantic import BaseModel
import joblib, os, numpy as np

router = APIRouter()
_repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
model_path = os.path.join(os.getenv("MODEL_PATH", os.path.join(_repo_root, "resources", "models")), "rf_quality.pkl")
model = None
try:
    model = joblib.load(model_path)
    print(f"Quality model loaded from {model_path}")
except Exception as e:
    print(f"Warning: Could not load quality model: {e}")

class WaterReading(BaseModel):
    pH: float
    temp_c: float
    do_mg_l: float

@router.post("/predict/quality")
async def predict_quality(reading: WaterReading):
    from fastapi import HTTPException
    from fastapi.responses import JSONResponse
    if model is None:
        return JSONResponse({"error": "Quality model not loaded"}, status_code=503)
    try:
        features = np.array([[reading.pH, reading.temp_c, reading.do_mg_l]])
        prediction = model.predict(features)
        score = round(float(prediction[0]), 2)
        status = "ok" if score >= 70 else "warn" if score >= 40 else "critical"
        return JSONResponse({"score": score, "status": status})
    except BaseException as e:
        import traceback
        print("PREDICT ERROR:", traceback.format_exc())
        return JSONResponse({"error": str(e)}, status_code=500)
