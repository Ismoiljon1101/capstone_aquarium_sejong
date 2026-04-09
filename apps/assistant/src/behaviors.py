import subprocess as sp
import sys 
from decouple import config 
import requests
import llm_manager
from tts_init import vs_speak
from gui_manager import update_gui_response, update_gui_camera_frame, set_gui_camera_status
import cv2
import time
import os
import threading

WATER_API = config('WATER_API_KEY')
CAMERA_API = config('CAMERA_API')

# Global camera thread reference
_camera_thread = None
_camera_running = False

def close_camera():
    """Signal camera to close and wait for thread to finish"""
    global _camera_running, _camera_thread
    if not _camera_running:
        return True
    
    exit_file = os.path.join(os.path.dirname(__file__), '.camera_exit')
    try:
        with open(exit_file, 'w') as f:
            f.write('1')
        _camera_running = False
        
        # Wait for thread to finish (with timeout)
        if _camera_thread and _camera_thread.is_alive():
            _camera_thread.join(timeout=2.0)
        
        return True
    except:
        return False

def is_camera_running():
    """Check if camera is currently running"""
    global _camera_running, _camera_thread
    return _camera_running and _camera_thread is not None and _camera_thread.is_alive()

#open camera behaviors
def _camera_worker():
    """Camera worker function that runs in a separate thread"""
    global _camera_running
    from ultralytics import YOLO
    import ultralytics
    
    CONF_THRESH = 0.5
    model = YOLO("latest.pt")
    
    def open_cap():
        cap = cv2.VideoCapture(CAMERA_API)  # change to (1) if using external USB camera
        return cap
    
    cap = open_cap()
    set_gui_camera_status(True)
    
    if cap.isOpened():
        print("Camera is connected")
    else:
        print("Error: Camera not connected")
        set_gui_camera_status(False)
        _camera_running = False
        return
    
    try:
        while _camera_running:
            ret, frame = cap.read()
            if not ret:
                print("Cannot receive frame, retrying...")
                time.sleep(1)
                cap.release()
                cap = open_cap()
                continue
            
            # Resize if too large (optimize for performance)
            h, w = frame.shape[:2]
            max_dim = 640
            if max(h, w) > max_dim:
                scale = max_dim / max(h, w)
                # Use INTER_LINEAR for faster resizing
                frame = cv2.resize(frame, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_LINEAR)
            
            # Run inference with YOLO11 (non-blocking if possible)
            results = model(frame, conf=CONF_THRESH, verbose=False)
            
            # Draw predictions on the frame
            annotated_frame = results[0].plot()
            
            # Update GUI with frame
            update_gui_camera_frame(annotated_frame)
            
            # Check for exit signal (file-based)
            exit_file = os.path.join(os.path.dirname(__file__), '.camera_exit')
            if os.path.exists(exit_file):
                os.remove(exit_file)
                _camera_running = False
                break
            
            # Adaptive delay - skip sleep if we're behind schedule
            # This helps maintain smooth frame rate
            time.sleep(0.03)  # ~30 FPS target
    finally:
        cap.release()
        set_gui_camera_status(False)
        _camera_running = False
        print("Camera closed")

def open_camera():
    """Open camera with YOLO detection and stream to GUI (non-blocking)"""
    global _camera_thread, _camera_running
    
    # Check if camera is already running
    if is_camera_running():
        print("Camera is already running")
        return
    
    # Clear any existing exit file
    exit_file = os.path.join(os.path.dirname(__file__), '.camera_exit')
    if os.path.exists(exit_file):
        os.remove(exit_file)
    
    # Start camera in background thread
    _camera_running = True
    _camera_thread = threading.Thread(target=_camera_worker, daemon=True)
    _camera_thread.start()
    print("Camera started in background thread")

def water_report():
    water_data_API = WATER_API
    response = requests.get(water_data_API)
    report = llm_manager.ollama_chat(f"Make a report about water condition base on this {response.text} JSON file, then give me any advice if you have, super short answer, speak like human")
    update_gui_response(report)
    vs_speak(report)

def water_check():
    water_data_API = WATER_API
    response = requests.get(water_data_API)
    print(response.text)

#Fis Feeder request 
import requests

FEEDER_API = config('FEEDER_API')
def fish_feeder_status():
    print(FEEDER_API+"api/feeder/feed-status")
    response = requests.get(FEEDER_API+"api/feeder/feed-status")
    hw = response.json()
    if hw["connected"]:
        print("Feeder hardware is ready")
    else:
        print("Feeder hardware not connected")

def fish_feeder_active():
    API_FEEDER_ACTIVE = FEEDER_API + "api/feeder/feed"
    print(API_FEEDER_ACTIVE)
    response = requests.post(
        API_FEEDER_ACTIVE,
        json = {"duration": 1, "source":"python-va"},
        headers={"Content-Type": "application/json"}
    )
    print("Status code:", response.status_code)
    print(response.text)