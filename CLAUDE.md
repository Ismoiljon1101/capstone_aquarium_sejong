# Fishlinic Aquaculture System

## Response Style
- Be terse. No filler. No "I'll", "Let me", "Here's". Just do.
- Tool first, talk after. Action > explanation.
- No summaries of what you just did unless asked.
- Skip "happy to help", "great question", pleasantries.
- 1 sentence max per status update. Prefer 0.

## Tech Stack
- Monorepo: pnpm workspaces
- Backend: NestJS (services/backend, name: `backend`), port 3001
- Dashboard: Next.js 16 (apps/dashboard, name: `fishlinic`), port 3000
- Mobile: Expo SDK 54 / React Native 0.81 (apps/mobile, name: `fishlinic-mobile`), port 8081
- AI Predictor: FastAPI (services/ai-predictor), port 8000
- Serial Bridge: (services/serial-bridge), port 3002
- Shared types: shared/types

## Build & Run
- Install: `pnpm install` (from root)
- All (no mobile): `pnpm dev`
- All (with mobile): `pnpm dev:all`
- Backend only: `pnpm dev:backend`
- Dashboard only: `pnpm dev:dashboard`
- AI only: `pnpm dev:ai`
- Serial bridge only: `pnpm dev:bridge`
- Mobile only: `pnpm dev:mobile`

## Key Conventions
- Atomic Design: atoms/ molecules/ organisms/ screens/
- Socket events: sensor:update, alert:new, fish:count, health:report, actuator:state
- API base: http://localhost:3001
- AI base: http://localhost:8000
- Dark theme: bg #020617, cards #0f172a

## Active Tasks
- [x] Add HistoryScreen to navigation
- [x] Fix HistoryScreen range selector (was always calling getLatest)
- [x] Delete dead HomeScreen
- [x] Fix backend nest CLI (pnpm exec nest)
- [x] Delete 11 orphaned component/service files (molecules, organisms, socket.service.ts)
- [x] Add GET /sensors/history?range= endpoint to backend (SensorsController + SensorsService)
- [x] Fix useSocket.ts: wrap `on` in useCallback — was causing infinite loops in screens using [on] deps
- [x] Fix all AI predictor route paths and model paths
- [x] Consolidate models into models/ (disease, quality, behavior, anomaly)
- [x] Project cleanup (pycache, old outputs, duplicate folders)
- [x] Create AIMonitorPanel.tsx component (water quality + disease detection)
- [x] Wire AIMonitorPanel into fish-health/page.tsx
- [x] Fix root package.json dev scripts with correct package names and ports
