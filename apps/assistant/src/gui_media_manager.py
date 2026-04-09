import numpy as np
import cv2
import os
import json
from PyQt6.QtGui import QImage, QPixmap
from PyQt6.QtCore import Qt

def update_waveform_logic(self, frame):
    if self.stream is not None:
        try:
            data = self.stream.read(self.CHUNK, exception_on_overflow=False)
            audio_array = np.frombuffer(data, dtype=np.int16)
            self.audio_data = audio_array
        except:
            pass
    
    x = np.arange(len(self.audio_data))
    self.line.set_data(x, self.audio_data)
    self.canvas.draw()
    return [self.line]

def update_camera_logic(self):
    camera_file = os.path.join(os.path.dirname(__file__), '.veronica_camera.jpg')
    camera_status_file = os.path.join(os.path.dirname(__file__), '.veronica_camera_status.json')
    
    camera_active = False
    if os.path.exists(camera_status_file):
        try:
            with open(camera_status_file, 'r') as f:
                status_data = json.load(f)
                camera_active = status_data.get('active', False)
                timestamp = status_data.get('timestamp', 0)
                
                if camera_active:
                    if timestamp > self.last_camera_timestamp:
                        self.last_camera_timestamp = timestamp
                        self.camera_card.show()
                        self.wave_card.hide()
                else:
                    self.camera_card.hide()
                    self.wave_card.show()
                    self.camera_label.setText("Camera Off")
        except:
            pass
    
    if camera_active and os.path.exists(camera_file):
        try:
            frame = cv2.imread(camera_file)
            if frame is not None:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                h, w, ch = rgb_frame.shape
                qt_image = QImage(rgb_frame.data, w, h, ch * w, QImage.Format.Format_RGB888)
                pixmap = QPixmap.fromImage(qt_image)
                scaled_pixmap = pixmap.scaled(self.camera_label.size(), Qt.AspectRatioMode.KeepAspectRatio)
                self.camera_label.setPixmap(scaled_pixmap)
        except:
            pass
