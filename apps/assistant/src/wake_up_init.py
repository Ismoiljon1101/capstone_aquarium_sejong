"""
Wake word detection — priority chain:
  1. Porcupine  (premium, needs PVPORCUPINE_KEY + .ppn file)
  2. openWakeWord 'hey_jarvis' (free, open-source)
  3. Keyboard Enter (fallback / dev mode)
"""

import os
try:
    import pyaudio as _pyaudio
except ImportError:
    _pyaudio = None

from decouple import config

USE_PORCUPINE    = False
USE_OWW          = False
hotword_detector = None
oww_model        = None

# ── 1. Try Porcupine ─────────────────────────────────────────────────────
try:
    import pvporcupine, struct

    _key  = config('PVPORCUPINE_KEY', default='').strip().strip('"')
    _path = config('KW_PATH',         default='').strip().strip('"')

    if _key and _path and os.path.exists(_path):
        hotword_detector = pvporcupine.create(access_key=_key, keyword_paths=[_path])
        USE_PORCUPINE    = True
        print("[Wake] Porcupine ready ✓")
    else:
        raise ValueError("PVPORCUPINE_KEY or KW_PATH not configured")

except Exception as _e:
    print(f"[Wake] Porcupine unavailable: {_e}")

# ── 2. Try openWakeWord ──────────────────────────────────────────────────
if not USE_PORCUPINE:
    try:
        import numpy as _np
        from openwakeword.model import Model as _OWWModel
        oww_model = _OWWModel(wakeword_models=["hey_jarvis"], inference_framework="onnx")
        USE_OWW   = True
        print("[Wake] openWakeWord ready — say 'Hey Jarvis' to activate Veronica ✓")
    except Exception as _e2:
        print(f"[Wake] openWakeWord unavailable: {_e2}")
        print("[Wake] Using keyboard fallback — press Enter to speak")


def wakeup_check():
    return True


def wakeup():
    """Block until wake word detected (or Enter pressed in fallback mode)."""

    # Porcupine path
    if USE_PORCUPINE and _pyaudio:
        import struct
        pa     = _pyaudio.PyAudio()
        stream = pa.open(
            rate=hotword_detector.sample_rate, channels=1,
            format=_pyaudio.paInt16, input=True,
            frames_per_buffer=hotword_detector.frame_length,
        )
        print("[Wake] Listening for wake word…")
        try:
            while True:
                pcm = stream.read(hotword_detector.frame_length, exception_on_overflow=False)
                pcm = struct.unpack_from("h" * hotword_detector.frame_length, pcm)
                if hotword_detector.process(pcm) >= 0:
                    print("[Wake] Hotword detected!")
                    break
        finally:
            stream.stop_stream(); stream.close(); pa.terminate()
        return

    # openWakeWord path
    if USE_OWW and _pyaudio:
        import numpy as np
        CHUNK  = 1280   # ~80 ms @ 16 kHz
        pa     = _pyaudio.PyAudio()
        stream = pa.open(rate=16000, channels=1, format=_pyaudio.paInt16,
                         input=True, frames_per_buffer=CHUNK)
        print("[Wake] Listening for 'Hey Jarvis'…")
        try:
            while True:
                raw   = stream.read(CHUNK, exception_on_overflow=False)
                arr   = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
                pred  = oww_model.predict(arr)
                score = pred.get("hey_jarvis", 0)
                if score > 0.5:
                    print(f"[Wake] Detected (score={score:.2f})")
                    break
        finally:
            stream.stop_stream(); stream.close(); pa.terminate()
        return

    # Keyboard fallback
    input("\n[Wake] Press Enter to speak to Veronica… ")
