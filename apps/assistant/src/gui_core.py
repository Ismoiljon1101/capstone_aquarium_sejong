import numpy as np
import requests
import time
from PyQt6.QtCore import QThread, pyqtSignal

class SensorUpdateThread(QThread):
    """Thread for updating sensor data"""
    data_updated = pyqtSignal(float, float, float)  # oxygen, ph, temperature
    
    def __init__(self, water_api):
        super().__init__()
        self.water_api = water_api
        self.running = True
        
    def run(self):
        while self.running:
            try:
                if self.water_api:
                    response = requests.get(self.water_api, timeout=2)
                    if response.status_code == 200:
                        data = response.json()
                        if isinstance(data, dict):
                            oxygen = float(data.get('oxygen', data.get('do_mg_l', data.get('oxygen_level', 8.5))))
                            ph = float(data.get('ph', data.get('pH', data.get('ph_level', 7.2))))
                            temp = float(data.get('temperature', data.get('temp_c', data.get('temp_level', 25.0))))
                            self.data_updated.emit(oxygen, ph, temp)
                            time.sleep(1)
                            continue
                
                # Simulate data if API not available
                oxygen = 8.5 + np.random.uniform(-0.5, 0.5)
                ph = 7.2 + np.random.uniform(-0.2, 0.2)
                temp = 25.0 + np.random.uniform(-1, 1)
                self.data_updated.emit(oxygen, ph, temp)
            except Exception as e:
                print(f"Sensor update error: {e}")
                # Use simulated data on error
                oxygen = 8.5 + np.random.uniform(-0.5, 0.5)
                ph = 7.2 + np.random.uniform(-0.2, 0.2)
                temp = 25.0 + np.random.uniform(-1, 1)
                self.data_updated.emit(oxygen, ph, temp)
            
            time.sleep(1)
    
    def stop(self):
        self.running = False
