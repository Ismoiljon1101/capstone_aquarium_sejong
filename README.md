# Camstore: Advanced AI Fish Health Monitoring System

Camstore is a comprehensive, multi-disciplinary platform designed for real-time monitoring and anomaly detection in aquatic environments. Led by **Ismoiljon Masharipov (TA)**, the project integrates cutting-edge AI, robust backend services, and a premium mobile experience.

## 🚀 Project Vision

To provide a state-of-the-art solution for fish health management, utilizing computer vision for detection, growth prediction models, and real-time sensor integration via Arduino.

## 👥 The Team

- **Ismoiljon Masharipov (TA)**: Project Lead, Fullstack Architect, and System Integration.
- **Firdavs**: AI Specialist - Focused on anomaly detection, YOLO-based fish detection, and growth prediction.
- **Hamidullo**: Research & Documentation - Specialized in data information and system parameters (Temp, Feeding, Light).
- **Sarvar**: Hardware Lead - Arduino integration, sensor calibration, and data acquisition.
- **Maral**: Core Team Member contributing to system research and development.

## 🛠 Technical Architecture

### Backend (NestJS)

- **Real-time Communication**: Integrated with **Socket.io** for instantaneous updates from AI models and sensors.
- **Automated Tasks**: **Cron jobs** for periodic AI model inference and database synchronization.
- **Strict MVC**: Clean, layered architecture for scalability.

### Frontend (Expo / React Native)

- **Navigation**: Expo Router with tab-based dashboard and deep-linking capabilities.
- **Styling**: **NativeWind** (Tailwind CSS) for a premium, responsive UI.
- **Atomic Design**: Highly modular component structure (Atoms, Molecules, Organisms).

### AI & Hardware

- **Models**: Anomaly detection for water conditions, YOLO for activity tracking, and growth forecasting.
- **Sensors**: Water temperature, light intensity, and feeding timers managed via **Arduino**.

## 📂 Structure

- `/aqua_server`: NestJS Backend (pnpm, strict MVC).
- `/aqua_app`: Expo Frontend (pnpm, Atomic Design, NativeWind).

---
*Built with ❤️ by the Camstore Team.*
