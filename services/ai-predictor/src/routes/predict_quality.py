# predict_quality.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import joblib, os, sqlite3, numpy as np
from datetime import datetime

router = APIRouter()

# ── Paths ──────────────────────────────────────────────────────────────────────
_repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
model_path = os.path.join(_repo_root, "models", "quality", "best_rf_water_quality.pkl")
db_path    = os.path.join(_repo_root, "services", "backend", "fishlinic.sqlite")

# ── Model loading ──────────────────────────────────────────────────────────────
model      = None
load_error = None

try:
    model = joblib.load(model_path)
    print(f"[Quality] Model loaded from {model_path}")
except Exception as e:
    load_error = str(e)
    print(f"[Quality] Model load failed: {e}")

# ── DB setup ───────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def ensure_quality_table():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS water_quality_readings (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT NOT NULL,
            ph          REAL NOT NULL,
            temp_c      REAL NOT NULL,
            do_mg_l     REAL NOT NULL,
            score       REAL NOT NULL,
            condition   TEXT NOT NULL,
            status      TEXT NOT NULL,
            is_alert    INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

ensure_quality_table()

# ── Scoring logic ──────────────────────────────────────────────────────────────
def score_to_condition(raw_prediction) -> dict:
    """
    The RF model outputs string labels: 'Good', 'Average'/'Caution', 'Bad'
    OR numeric 0.0-1.0. Handle both cases.
    """
    # Handle string output from model
    if isinstance(raw_prediction, str):
        label = raw_prediction.strip().lower()
        if label in ("good",):
            return {"score": 100.0, "condition": "Good", "status": "ok", "is_alert": 0}
        elif label in ("average", "caution", "moderate"):
            return {"score": 50.0, "condition": "Average", "status": "warn", "is_alert": 0}
        else:  # bad, critical, poor
            return {"score": 10.0, "condition": "Bad", "status": "critical", "is_alert": 1}

    # Handle numeric output
    raw = float(raw_prediction)
    score = round(raw * 100, 2)

    if raw >= 0.75:
        return {"score": score, "condition": "Good",    "status": "ok",       "is_alert": 0}
    elif raw >= 0.35:
        return {"score": score, "condition": "Average", "status": "warn",     "is_alert": 0}
    else:
        return {"score": score, "condition": "Bad",     "status": "critical", "is_alert": 1}

def get_parameter_warnings(ph: float, temp_c: float, do_mg_l: float) -> list:
    """Return specific parameter warnings for actionable feedback."""
    warnings = []
    if ph < 6.5:
        warnings.append({"param": "pH", "value": ph, "issue": "Too acidic (below 6.5)"})
    elif ph > 8.5:
        warnings.append({"param": "pH", "value": ph, "issue": "Too alkaline (above 8.5)"})

    if temp_c < 22:
        warnings.append({"param": "temperature", "value": temp_c, "issue": "Too cold (below 22°C)"})
    elif temp_c > 30:
        warnings.append({"param": "temperature", "value": temp_c, "issue": "Too hot (above 30°C)"})

    if do_mg_l < 5.0:
        warnings.append({"param": "dissolved_oxygen", "value": do_mg_l, "issue": "Low oxygen (below 5 mg/L) — risk of fish stress"})
    elif do_mg_l > 12.0:
        warnings.append({"param": "dissolved_oxygen", "value": do_mg_l, "issue": "Supersaturation (above 12 mg/L)"})

    return warnings

def log_reading(ph, temp_c, do_mg_l, result: dict):
    conn = get_db()
    conn.execute("""
        INSERT INTO water_quality_readings
            (timestamp, ph, temp_c, do_mg_l, score, condition, status, is_alert)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.utcnow().isoformat(),
        ph, temp_c, do_mg_l,
        result["score"],
        result["condition"],
        result["status"],
        result["is_alert"],
    ))
    conn.commit()
    conn.close()

# ── Request models ─────────────────────────────────────────────────────────────
class WaterReading(BaseModel):
    pH:     float
    temp_c: float
    do_mg_l: float

# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/predict/quality")
async def predict_quality(reading: WaterReading):
    """Predict water quality condition from pH, temperature and dissolved oxygen."""
    if model is None:
        return JSONResponse({"error": f"Quality model not loaded: {load_error}"}, status_code=503)

    try:
        features   = np.array([[reading.pH, reading.temp_c, reading.do_mg_l]])
        prediction = model.predict(features)
        result     = score_to_condition(prediction[0])
        warnings   = get_parameter_warnings(reading.pH, reading.temp_c, reading.do_mg_l)

        log_reading(reading.pH, reading.temp_c, reading.do_mg_l, result)

        return JSONResponse({
            "status":    result["status"],
            "condition": result["condition"],
            "score":     result["score"],
            "is_alert":  bool(result["is_alert"]),
            "readings": {
                "pH":     reading.pH,
                "temp_c": reading.temp_c,
                "do_mg_l": reading.do_mg_l,
            },
            "warnings":  warnings,
            "timestamp": datetime.utcnow().isoformat(),
        })

    except Exception as e:
        import traceback
        print("PREDICT ERROR:", traceback.format_exc())
        return JSONResponse({"error": str(e)}, status_code=500)


@router.get("/quality/history")
def get_quality_history(limit: int = 100):
    """Return recent water quality readings from DB."""
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM water_quality_readings
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return {"data": [dict(r) for r in rows]}


@router.get("/quality/alerts")
def get_quality_alerts(limit: int = 50):
    """Return only critical water quality readings."""
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM water_quality_readings
        WHERE is_alert = 1
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return {"alerts": [dict(r) for r in rows]}


@router.get("/quality/stats")
def get_quality_stats():
    """Return water quality statistics."""
    conn = get_db()
    total    = conn.execute("SELECT COUNT(*) FROM water_quality_readings").fetchone()[0]
    alerts   = conn.execute("SELECT COUNT(*) FROM water_quality_readings WHERE is_alert=1").fetchone()[0]
    avg      = conn.execute("SELECT AVG(score), AVG(ph), AVG(temp_c), AVG(do_mg_l) FROM water_quality_readings").fetchone()
    by_cond  = conn.execute("""
        SELECT condition, COUNT(*) as count
        FROM water_quality_readings
        GROUP BY condition
        ORDER BY count DESC
    """).fetchall()
    conn.close()

    return {
        "total_readings":  total,
        "total_alerts":    alerts,
        "averages": {
            "score":   round(avg[0] or 0, 2),
            "pH":      round(avg[1] or 0, 2),
            "temp_c":  round(avg[2] or 0, 2),
            "do_mg_l": round(avg[3] or 0, 2),
        },
        "by_condition": [dict(r) for r in by_cond],
    }
