from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, QFrame, QTextEdit)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont

def create_header_ui(self):
    header_frame = QFrame()
    header_frame.setStyleSheet("background-color: transparent; padding: 12px 0px;")
    header_layout = QHBoxLayout(header_frame)
    header_layout.setContentsMargins(0, 0, 0, 0)
    header_layout.setSpacing(12)
    
    # Title - Apple style
    title_label = QLabel("Veronica")
    title_label.setStyleSheet("""
        color: #1d1d1f;
        font-size: 34px;
        font-weight: 600;
        background-color: transparent;
        letter-spacing: -0.5px;
    """)
    header_layout.addWidget(title_label)
    
    # Subtitle
    subtitle_label = QLabel("Smart Aquaculture Assistant")
    subtitle_label.setStyleSheet("""
        color: #86868b;
        font-size: 15px;
        font-weight: 400;
        background-color: transparent;
    """)
    header_layout.addWidget(subtitle_label)
    
    header_layout.addStretch()
    
    # Digital clock
    clock_container = QFrame()
    clock_container.setStyleSheet("background-color: transparent;")
    clock_layout = QHBoxLayout(clock_container)
    clock_layout.setContentsMargins(12, 6, 12, 6)
    
    self.clock_label = QLabel("MON (01/01/2024) - 00:00:00 - ☀️")
    self.clock_label.setStyleSheet("""
        color: #1d1d1f;
        font-size: 13px;
        font-weight: 500;
        background-color: transparent;
        font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
    """)
    clock_layout.addWidget(self.clock_label)
    header_layout.addWidget(clock_container)
    
    # Listening indicator
    self.listening_light = QLabel("●")
    self.listening_light.setStyleSheet("color: #86868b; font-size: 10px;")
    header_layout.addWidget(self.listening_light)
    
    self.listening_label = QLabel("Idle")
    self.listening_label.setStyleSheet("color: #86868b; font-size: 13px;")
    header_layout.addWidget(self.listening_label)
    
    self.status_label = QLabel("● Active")
    self.status_label.setStyleSheet("color: #34c759; font-size: 13px;")
    header_layout.addWidget(self.status_label)
    
    return header_frame

def create_sensor_card_ui(self, label, unit, value, color):
    card = QFrame()
    card.setStyleSheet("""
        QFrame {
            background-color: #ffffff;
            border: 0.5px solid #d2d2d7;
            border-radius: 12px;
        }
    """)
    card_layout = QVBoxLayout(card)
    card_layout.setContentsMargins(18, 16, 18, 16)
    
    main_layout = QHBoxLayout()
    label_widget = QLabel(label)
    label_widget.setStyleSheet("color: #86868b; font-size: 13px;")
    main_layout.addWidget(label_widget)
    main_layout.addStretch()
    
    value_label = QLabel(f"{value:.2f}")
    value_label.setStyleSheet(f"color: {color}; font-size: 32px; font-weight: 600;")
    main_layout.addWidget(value_label)
    self.value_labels[label] = value_label
    
    if unit:
        unit_label = QLabel(unit)
        unit_label.setStyleSheet("color: #86868b; font-size: 15px;")
        main_layout.addWidget(unit_label)
    
    card_layout.addLayout(main_layout)
    status_text = QLabel("● Normal")
    status_text.setStyleSheet("color: #34c759; font-size: 11px;")
    card_layout.addWidget(status_text)
    self.status_texts[label] = status_text
    
    return card

def create_response_card_ui(self):
    card = QFrame()
    card.setStyleSheet("background-color: #ffffff; border: 0.5px solid #d2d2d7; border-radius: 16px;")
    card_layout = QVBoxLayout(card)
    card_layout.addWidget(QLabel("Response", styleSheet="font-weight: 600;"))
    
    self.response_text = QTextEdit()
    self.response_text.setReadOnly(True)
    self.response_text.setMinimumHeight(280)
    self.response_text.setStyleSheet("""
        QTextEdit {
            background-color: #f5f5f7;
            color: #1d1d1f;
            border-radius: 12px;
            padding: 20px;
        }
    """)
    card_layout.addWidget(self.response_text)
    return card
