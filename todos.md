# Camstore: TODO List

## 🐛 Known Issues & Fixes

- [ ] **NativeWind Web Compatibility**: `nativewind/babel` plugin throws `Use process(css).then(cb) to work with async plugins` on **Node.js v24**. Fix: Downgrade to **Node.js v18 LTS** using `nvm use 18` or replace `className` props with native `StyleSheet`.

---

## 🚀 Next Week Plan (Ismoiljon - TA / Fullstack)

- [ ] Build all core APIs (`/fish`, `/sensors`, `/alerts`, `/feed`)
- [ ] Implement Socket.io for real-time sensor data streaming
- [ ] Implement monitoring Cron jobs for periodic AI model inference
- [ ] Finish MVP and connect all modules together

## 🤖 AI Module (Firdavs)

- [ ] Train custom fish detection model for better accuracy
- [ ] Integrate YOLO AI with live camera and full system
- [ ] Improve anomaly detection and connect all models together

## 🔬 Research & Documentation (Hamidullo)

- [ ] Document water temperature thresholds
- [ ] Document feeding time schedules
- [ ] Document light status requirements and sensor readings

## 🔧 Hardware (Sarvar)

- [ ] Connect water temperature sensor via Arduino
- [ ] Read temperature data using Arduino
- [ ] Display sensor values in Serial Monitor and pipe to backend

## 🧩 General

- [ ] Connect Arduino sensor data to the NestJS backend via REST/Socket
- [ ] Populate Statistics screen with real sensor data
- [ ] Populate Actions screen with functional controls (Feed Now, Lights, etc.)
- [ ] Set up PostgreSQL database for sensor history
- [ ] Add authentication (JWT) to the backend
