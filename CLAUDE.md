# Fishlinic Aquaculture System

## Response Style
- Be terse. No filler. No "I'll", "Let me", "Here's". Just do.
- Tool first, talk after. Action > explanation.
- No summaries of what you just did unless asked.
- Skip "happy to help", "great question", pleasantries.
- 1 sentence max per status update. Prefer 0.

## Tech Stack
- Monorepo: pnpm workspaces
- Backend: NestJS (services/backend), port 3000
- Dashboard: Next.js 16 (apps/dashboard)
- Mobile: Expo SDK 54 / React Native 0.81 (apps/mobile)
- Shared types: shared/types

## Build & Run
- Install: `pnpm install` (from root)
- Backend: `cd services/backend && pnpm dev`
- Mobile: `cd apps/mobile && npx expo start`
- Dashboard: `cd apps/dashboard && pnpm dev`

## Key Conventions
- Atomic Design: atoms/ molecules/ organisms/ screens/
- Socket events: sensor:update, alert:new, fish:count, health:report, actuator:state
- API base: http://localhost:3000
- Dark theme: bg #020617, cards #0f172a
