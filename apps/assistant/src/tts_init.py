try:
    from kokoro_onnx import Kokoro
    import sounddevice as sd
    import numpy as np
    import os

    # Search for model path
    model_path = "resources/models/kokoro-v0_19.onnx"
    voices_path = "resources/models/voices.bin"
    
    if os.path.exists(model_path) and os.path.exists(voices_path):
        kokoro = Kokoro(model_path, voices_path)
    else:
        kokoro = None
        print("Kokoro model files not found in resources/models/")

except ImportError:
    kokoro = None
    print("kokoro-onnx or sounddevice not installed")

def vs_speak(text, voice_preset="af_heart"):
    if not text or not kokoro:
        print(f"Cannot speak: text empty or kokoro not initialized. Text: {text}")
        return
    
    try:
        samples, sample_rate = kokoro.create(text, voice=voice_preset, speed=1.0, lang="en-us")
        sd.play(samples, sample_rate)
        sd.wait()
    except Exception as e:
        print(f"Speech error: {e}")
