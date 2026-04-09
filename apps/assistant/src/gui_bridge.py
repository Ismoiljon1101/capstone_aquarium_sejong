import os
import json
import time
import cv2
import sys
import multiprocessing as mp
from PyQt6.QtWidgets import QApplication
from PyQt6.QtGui import QPalette, QColor

def start_gui_background_logic(VirtualAssistantGUI):
    """Start GUI in background process"""
    def _run():
        app = QApplication(sys.argv)
        app.setStyle('Fusion')
        palette = QPalette()
        palette.setColor(QPalette.ColorRole.Window, QColor(245, 245, 247))
        palette.setColor(QPalette.ColorRole.WindowText, QColor(29, 29, 31))
        app.setPalette(palette)
        
        window = VirtualAssistantGUI()
        window.show()
        sys.exit(app.exec())

    process = mp.Process(target=_run, daemon=True)
    process.start()
    return process

def update_gui_response_logic(response_text):
    response_file = os.path.join(os.path.dirname(__file__), '.veronica_response.json')
    try:
        with open(response_file, 'w', encoding='utf-8') as f:
            json.dump({'response': response_text, 'timestamp': time.time()}, f)
    except Exception as e:
        print(f"Error updating GUI: {e}")

def set_gui_listening_status_logic(listening):
    listening_file = os.path.join(os.path.dirname(__file__), '.veronica_listening.json')
    try:
        with open(listening_file, 'w') as f:
            json.dump({'listening': listening, 'timestamp': time.time()}, f)
    except:
        pass

def update_gui_camera_frame_logic(frame):
    camera_file = os.path.join(os.path.dirname(__file__), '.veronica_camera.jpg')
    camera_info_file = os.path.join(os.path.dirname(__file__), '.veronica_camera_info.json')
    try:
        cv2.imwrite(camera_file, frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        with open(camera_info_file, 'w') as f:
            json.dump({'timestamp': time.time()}, f)
    except:
        pass
