import sys
import os
import json
import time
import math
import numpy as np
import cv2
import requests
from PyQt6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QFrame, QTextEdit)
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal
from PyQt6.QtGui import QFont, QColor, QPalette, QImage, QPixmap
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.animation import FuncAnimation
from decouple import config

# Import modular components
from gui_core import SensorUpdateThread
import gui_layout_utils as layout
import gui_logic as logic
import gui_media_manager as media
import gui_bridge

try:
    import pyaudio
except ImportError:
    pyaudio = None

class VirtualAssistantGUI(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Veronica - Smart Aquaculture Assistant")
        self.setGeometry(100, 100, 1400, 900)
        
        self.WATER_API = config('WATER_API_KEY', default=None)
        self.CHUNK, self.FORMAT, self.CHANNELS, self.RATE = 1024, (pyaudio.paInt16 if pyaudio else 0), 1, 44100
        self.audio = pyaudio.PyAudio() if pyaudio else None
        self.stream = None
        self.audio_data = np.zeros(self.CHUNK)
        
        # Data state
        self.oxygen_level, self.ph_level, self.temperature = 0.0, 7.0, 25.0
        self.max_data_points = 60
        self.time_data, self.oxygen_history, self.ph_history, self.temperature_history = [], [], [], []
        self.start_time = time.time()
        self.value_labels, self.status_texts, self.connection_statuses = {}, {}, {}
        self.is_listening, self.listening_alpha = False, 0.0
        self.last_response_timestamp = 0
        self.last_camera_timestamp = 0
        self.last_camera_frame_timestamp = 0
        self.current_response = ""

        self.setup_ui()
        self.start_services()

    def setup_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        central_widget.setStyleSheet("background-color: #f5f5f7;")
        main_layout = QVBoxLayout(central_widget)
        
        main_layout.addWidget(layout.create_header_ui(self))
        
        content = QHBoxLayout()
        left = QVBoxLayout()
        left.addWidget(layout.create_sensor_card_ui(self, "OXYGEN", "mg/L", self.oxygen_level, '#007AFF'))
        left.addWidget(layout.create_sensor_card_ui(self, "pH", "", self.ph_level, '#5856D6'))
        left.addWidget(layout.create_sensor_card_ui(self, "TEMP", "°C", self.temperature, '#FF9500'))
        
        # Connection card (simplified inline for now)
        conn_card = QFrame()
        conn_card.setStyleSheet("background-color: #ffffff; border-radius: 12px; border: 0.5px solid #d2d2d7;")
        conn_layout = QVBoxLayout(conn_card)
        conn_layout.addWidget(QLabel("Connections", styleSheet="font-weight: 600;"))
        self.setup_connection_items(conn_layout)
        left.addWidget(conn_card)
        left.addStretch()
        
        center = QVBoxLayout()
        center.addWidget(layout.create_response_card_ui(self))
        self.setup_graph(center)
        
        right = QVBoxLayout()
        self.setup_media(right)
        
        content.addLayout(left, 1)
        content.addLayout(center, 2)
        content.addLayout(right, 1)
        main_layout.addLayout(content)

    def setup_connection_items(self, layout):
        for name, key in [("Water API", "water_api"), ("Web URL", "web_url"), ("Database", "database")]:
            row = QHBoxLayout()
            dot = QLabel("●", styleSheet="color: #86868b;")
            txt = QLabel(f"{name}: Checking...")
            row.addWidget(dot); row.addWidget(txt); row.addStretch()
            layout.addLayout(row)
            self.connection_statuses[key] = {'dot': dot, 'text': txt}

    def setup_graph(self, layout):
        self.graph_fig, self.graph_ax = plt.subplots(figsize=(10, 4.5), facecolor='#ffffff')
        self.graph_ax2 = self.graph_ax.twinx()
        self.oxygen_line, = self.graph_ax.plot([], [], color='#007AFF', label='Oxygen')
        self.ph_line, = self.graph_ax.plot([], [], color='#5856D6', label='pH')
        self.temp_line, = self.graph_ax2.plot([], [], color='#FF9500', label='Temp')
        self.graph_canvas = FigureCanvas(self.graph_fig)
        layout.addWidget(self.graph_canvas)

    def setup_media(self, layout):
        self.wave_card = QFrame()
        wave_ly = QVBoxLayout(self.wave_card)
        self.fig, self.ax = plt.subplots(figsize=(8, 4))
        self.line, = self.ax.plot([], [], color='#007AFF')
        self.canvas = FigureCanvas(self.fig)
        wave_ly.addWidget(self.canvas)
        layout.addWidget(self.wave_card)
        
        self.camera_card = QFrame()
        self.camera_label = QLabel("Camera Off", alignment=Qt.AlignmentFlag.AlignCenter)
        self.camera_label.setMinimumSize(640, 480)
        cam_ly = QVBoxLayout(self.camera_card)
        cam_ly.addWidget(self.camera_label)
        layout.addWidget(self.camera_card)
        self.camera_card.hide()

    def start_services(self):
        self.sensor_thread = SensorUpdateThread(self.WATER_API)
        self.sensor_thread.data_updated.connect(self.update_data)
        self.sensor_thread.start()
        
        self.ani = FuncAnimation(self.fig, lambda f: media.update_waveform_logic(self, f), interval=50, blit=True)
        
        self.timers = [QTimer() for _ in range(5)]
        self.timers[0].timeout.connect(self.update_clock)
        self.timers[1].timeout.connect(lambda: logic.update_sensor_graph_logic(self))
        self.timers[2].timeout.connect(lambda: logic.type_next_character_logic(self))
        self.timers[3].timeout.connect(self.check_status_files)
        self.timers[4].timeout.connect(lambda: media.update_camera_logic(self))
        for t in self.timers: t.start(1000 if t == self.timers[0] else 50)

    def update_data(self, o, p, t):
        self.oxygen_level, self.ph_level, self.temperature = o, p, t
        self.time_data.append(time.time() - self.start_time)
        self.oxygen_history.append(o); self.ph_history.append(p); self.temperature_history.append(t)
        if len(self.time_data) > self.max_data_points:
            for arr in [self.time_data, self.oxygen_history, self.ph_history, self.temperature_history]: arr.pop(0)
        self.value_labels['OXYGEN'].setText(f"{o:.2f}")
        self.value_labels['pH'].setText(f"{p:.2f}")
        self.value_labels['TEMP'].setText(f"{t:.2f}")

    def update_clock(self):
        now = time.strftime("%a (%m/%d/%Y) - %H:%M:%S")
        self.clock_label.setText(f"{now}")

    def check_status_files(self):
        # Delegate checking to minimal wrappers
        resp_file = os.path.join(os.path.dirname(__file__), '.veronica_response.json')
        if os.path.exists(resp_file):
            with open(resp_file, 'r') as f:
                data = json.load(f)
                if data.get('timestamp', 0) > self.last_response_timestamp:
                    self.last_response_timestamp = data['timestamp']
                    logic.start_typing_animation_logic(self, data['response'])

    def type_next_character(self): logic.type_next_character_logic(self)

    def closeEvent(self, e):
        self.sensor_thread.stop(); self.sensor_thread.wait()
        plt.close('all'); e.accept()

# Bridge Functions
def start_gui_background(): return gui_bridge.start_gui_background_logic(VirtualAssistantGUI)
def update_gui_response(text): gui_bridge.update_gui_response_logic(text)
def set_gui_listening_status(status): gui_bridge.set_gui_listening_status_logic(status)
def update_gui_camera_frame(frame): gui_bridge.update_gui_camera_frame_logic(frame)
def stop_gui(): pass # Implementation simplified for brevity
