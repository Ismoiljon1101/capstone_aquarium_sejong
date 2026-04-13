import os

# Model v1.0 (int8 quantized, 88MB) — fallback to legacy v0.19 if present
_BASE = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'resources', 'models')

def _resolve(*candidates):
    for name in candidates:
        p = os.path.normpath(os.path.join(_BASE, name))
        if os.path.exists(p) and os.path.getsize(p) > 1024:  # >1KB = real file
            return p
    return None

MODEL_PATH  = _resolve('kokoro-v1.0.int8.onnx', 'kokoro-v1.0.onnx', 'kokoro-v0_19.onnx')
VOICES_PATH = _resolve('voices-v1.0.bin', 'voices.bin')

kokoro = None

try:
    from kokoro_onnx import Kokoro
    import sounddevice as sd
    import numpy as np

    if MODEL_PATH and VOICES_PATH:
        print(f"[TTS] Loading {os.path.basename(MODEL_PATH)} + {os.path.basename(VOICES_PATH)}")
        kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
        print("[TTS] Kokoro ready ✓")
    else:
        print(f"[TTS] Model files not found in {_BASE}")
        print(f"      Expected: kokoro-v1.0.int8.onnx + voices-v1.0.bin")

except ImportError:
    print("[TTS] kokoro-onnx / sounddevice not installed — pip install kokoro-onnx sounddevice")


def vs_speak(text: str, voice_preset: str = "af_heart"):
    """Synthesize text to speech via Kokoro ONNX."""
    if not text:
        return
    if not kokoro:
        print(f"[TTS] Skipping speech (model not loaded): {text[:60]}")
        return
    try:
        samples, sample_rate = kokoro.create(
            text, voice=voice_preset, speed=1.0, lang="en-us"
        )
        sd.play(samples, sample_rate)
        sd.wait()
    except Exception as e:
        print(f"[TTS] Speech error: {e}")
