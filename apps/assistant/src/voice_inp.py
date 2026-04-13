import sounddevice as sd
from scipy.io.wavfile import write
import numpy as np
import whisper
try:
    import pyaudio
except ImportError:
    pyaudio = None
try:
    import pvcobra as _pvcobra_mod
except ImportError:
    _pvcobra_mod = None
from decouple import config
import threading
import queue
import time

# Pre-load Whisper model once (global)
_whisper_model = None
_model_loading = False
_model_lock = threading.Lock()

def _load_whisper_model():
    """Load Whisper model once and cache it (thread-safe)"""
    global _whisper_model, _model_loading
    if _whisper_model is not None:
        return _whisper_model
    
    with _model_lock:
        # Double-check after acquiring lock
        if _whisper_model is not None:
            return _whisper_model
        
        if not _model_loading:
            _model_loading = True
            print("Loading Whisper model (first time only)...")
            _whisper_model = whisper.load_model("base")
            print("Whisper model loaded!")
            _model_loading = False
    
    return _whisper_model

def voice_speak():
    """Optimized voice input with VAD and pre-loaded model"""
    SAMPLE_RATE = 16000
    CHUNK = 512
    SILENCE_THRESHOLD = 0.25  # Voice activity threshold (lower = more sensitive)
    MIN_RECORDING_TIME = 1.0  # Minimum recording time in seconds (give user time to start)
    MAX_RECORDING_TIME = 15.0  # Maximum recording time in seconds (increased)
    SILENCE_DURATION = 1.5  # Seconds of silence before stopping (more time to think/pause)
    PING_SKIP_DURATION = 0.5  # Skip first 0.5 seconds to avoid capturing ping sound
    INITIAL_SILENCE_ALLOWANCE = 1.5  # Allow silence at start (user needs time to start speaking)
    
    # Initialize Cobra for voice activity detection
    cobra = None
    try:
        if _pvcobra_mod:
            ACCESS_KEY = config('PVPORCUPINE_KEY', default='').strip().strip('"')
            if ACCESS_KEY:
                cobra = _pvcobra_mod.create(access_key=ACCESS_KEY)
    except Exception:
        cobra = None
    if not cobra:
        print("[VAD] Using energy-based fallback (no Cobra)")
    
    # Initialize audio
    pa = pyaudio.PyAudio()
    audio_queue = queue.Queue()
    audio_frames = []
    recording = True
    last_voice_time = None
    start_time = None
    
    def audio_callback(in_data, frame_count, time_info, status):
        if recording:
            audio_queue.put(in_data)
        return (None, pyaudio.paContinue)
    
    stream = pa.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=SAMPLE_RATE,
        input=True,
        frames_per_buffer=CHUNK,
        stream_callback=audio_callback
    )
    
    stream.start_stream()
    print("Recording... (speak now)")
    
    try:
        start_time = time.time()
        ping_skip_time = start_time + PING_SKIP_DURATION
        last_voice_time = None  # Will be set after ping skip
        frames_before_skip = []
        
        while recording:
            try:
                # Get audio chunk (reduced timeout for faster response)
                audio_data = audio_queue.get(timeout=0.05)
                audio_array = np.frombuffer(audio_data, dtype=np.int16)
                
                current_time = time.time()
                elapsed = current_time - start_time
                
                # Skip audio during ping sound (first 0.5 seconds)
                if current_time < ping_skip_time:
                    frames_before_skip.append(audio_array)
                    continue
                
                # Initialize last_voice_time after ping skip
                if last_voice_time is None:
                    last_voice_time = current_time
                
                # Add frames after ping skip
                audio_frames.append(audio_array)
                
                # Calculate time since ping skip
                elapsed_since_skip = current_time - ping_skip_time
                
                # Check VAD after ping skip period
                # Check voice activity if Cobra is available
                if cobra is not None:
                    voice_prob = cobra.process(audio_array) * 100
                    
                    if voice_prob > SILENCE_THRESHOLD * 100:
                        last_voice_time = current_time
                    else:
                        # Check if we've been silent long enough
                        silence_duration = current_time - last_voice_time
                        
                        # Allow initial silence period for user to start speaking
                        # Don't stop if we're still in the initial silence allowance period
                        if elapsed_since_skip < INITIAL_SILENCE_ALLOWANCE:
                            continue  # Keep recording, user might still be starting
                        
                        # Only stop if we've recorded minimum time AND been silent long enough
                        if elapsed_since_skip > MIN_RECORDING_TIME and silence_duration > SILENCE_DURATION:
                            print("Silence detected, stopping recording...")
                            recording = False
                            break
                else:
                    # Fallback: use simple energy-based VAD
                    energy = np.abs(audio_array).mean()
                    if energy > 500:  # Adjust threshold as needed
                        last_voice_time = current_time
                    else:
                        silence_duration = current_time - last_voice_time
                        
                        # Allow initial silence period for user to start speaking
                        if elapsed_since_skip < INITIAL_SILENCE_ALLOWANCE:
                            continue  # Keep recording, user might still be starting
                        
                        if elapsed_since_skip > MIN_RECORDING_TIME and silence_duration > SILENCE_DURATION:
                            print("Silence detected, stopping recording...")
                            recording = False
                            break
                
                # Maximum recording time limit
                if elapsed > MAX_RECORDING_TIME:
                    print("Maximum recording time reached")
                    recording = False
                    break
                    
            except queue.Empty:
                continue
                
    finally:
        stream.stop_stream()
        stream.close()
        pa.terminate()
        if cobra:
            cobra.delete()
    
    if not audio_frames:
        print("No audio recorded")
        return ""
    
    # Combine all audio frames
    audio = np.concatenate(audio_frames)
    audio = audio.astype(np.float32) / 32768.0  # Normalize to [-1, 1]
    
    print(f"Recording finished! Duration: {len(audio) / SAMPLE_RATE:.2f} seconds")
    
    # Use pre-loaded model
    model = _load_whisper_model()
    
    # Transcribe with optimized settings for speed
    result = model.transcribe(
        audio=audio, 
        fp16=False, 
        language='en',
        task='transcribe',
        beam_size=1,  # Faster decoding
        best_of=1,     # Faster decoding
        temperature=0.0,  # Deterministic output
        compression_ratio_threshold=2.4,  # Skip if too repetitive
        logprob_threshold=-1.0,  # Skip if low confidence
        no_speech_threshold=0.6  # Skip if no speech detected
    )
    text = result["text"].strip()
    
    print(f"Transcribed: {text}")
    return text

# Pre-load model on import (optional, can be lazy loaded)
# _load_whisper_model()
