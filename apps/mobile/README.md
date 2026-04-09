# Fishlinic Mobile (2026 Edition) 🐟📱

This is the mobile client for the Fishlinic Aquaculture Monitoring System. Built with **Expo SDK 55+** and **React Native**, it strictly follows the **Atomic Design Paradigm** and **Agent-Optimized** engineering standards.

## 🏗️ System Architecture

### 1. Atomic Hierarchy
We decompose the UI into five distinct levels to maintain a < 300-line modularity:
- **Atoms**: Primitive building blocks (`atoms/`). Stateless and logic-free.
- **Molecules**: Simple functional groups (`molecules/`). Connects atoms.
- **Organisms**: Complex business sections (`organisms/`). Integration point.
- **Screens**: Page-level containers (`screens/`). Handles layout routing.
- **Services**: The "Brain" (`services/`). Handles Socket.IO and API orchestration.

### 2. 🤖 For AI Agents (Guidelines)
To maintain this repository, future agents MUST follow these rules:
- **Pervasive Commenting**: Every block of logic must be preceded by a `//` explanation of intent.
- **Strict Modularity**: If a file approaches 280 lines, it MUST be refactored into sub-components.
- **Decoupled Data**: Never inject `useEffect` or `Socket.IO` logic directly into Atoms. Use Services or Organisms.

## 🚀 Getting Started

1. **Install Dependencies**: `pnpm install`
2. **Start Development**: `pnpm run dev`
3. **Simulation Mode**: By default, the app connects to `http://localhost:3000`. Ensure the monorepo backend is running.

---
**Verified: 2026 Modular Architecture Compliant.**
