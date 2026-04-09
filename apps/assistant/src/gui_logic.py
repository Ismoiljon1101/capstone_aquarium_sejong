import time
import numpy as np
from PyQt6.QtCore import QTimer

def start_typing_animation_logic(self, text):
    if hasattr(self, 'typing_timer') and self.typing_timer:
        self.typing_timer.stop()
    self.typing_text = text
    self.typing_index = 0
    self.response_text.clear()
    self.typing_timer = QTimer()
    self.typing_timer.timeout.connect(self.type_next_character)
    self.typing_timer.start(30)

def type_next_character_logic(self):
    if self.typing_index < len(self.typing_text):
        current_text = self.typing_text[:self.typing_index + 1]
        self.response_text.setPlainText(current_text)
        self.response_text.verticalScrollBar().setValue(self.response_text.verticalScrollBar().maximum())
        self.typing_index += 1
    else:
        if self.typing_timer:
            self.typing_timer.stop()
            self.typing_timer = None

def update_sensor_graph_logic(self):
    if len(self.time_data) == 0: return
    try:
        time_array = np.array(self.time_data)
        self.oxygen_line.set_data(time_array, np.array(self.oxygen_history))
        self.ph_line.set_data(time_array, np.array(self.ph_history))
        self.temp_line.set_data(time_array, np.array(self.temperature_history))
        
        x_min = max(0, time_array[-1] - 60)
        x_max = max(60, time_array[-1] + 5)
        self.graph_ax.set_xlim(x_min, x_max)
        self.graph_canvas.draw()
    except:
        pass
