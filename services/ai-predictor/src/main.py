# main.py
from fastapi import FastAPI
from src.routes import predict_disease, predict_count, predict_quality, predict_behavior

app = FastAPI(title="Fishlinic AI Predictor")

app.include_router(predict_disease.router)
app.include_router(predict_count.router)
app.include_router(predict_quality.router)
app.include_router(predict_behavior.router)

@app.get("/health")
def health(): return { "status": "ok" }
