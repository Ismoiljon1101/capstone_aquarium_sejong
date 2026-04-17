# Fishlinic — Historical Scaffolding TODO

> **Status (2026-04-17)**: the monorepo scaffolding phase this list describes
> is **complete**. The NestJS backend, AI predictor, serial bridge, mobile
> app, dashboard, shared types, firmware stubs and documentation set listed
> below all exist and run.
>
> **This file is kept only as a historical record of how the repo was laid
> out.** For the current sprint work, see:
>
> - **`project_status.md`** — live state of each subsystem today
> - **`docs/team-ownership.md`** — who owns what + the current sprint punch list
>
> Do not add new tasks here. Add them to `docs/team-ownership.md`.

---

## What was scaffolded

All phases below landed in the repo. Check the paths to confirm.

| Phase | Scope                                      | Verified at                                           |
|-------|--------------------------------------------|-------------------------------------------------------|
| 0     | Analysis + inventory                       | `docs/phase0-analysis.md`                             |
| 1     | Monorepo skeleton (pnpm workspaces)        | `package.json`, `pnpm-workspace.yaml`                 |
| 2     | Shared types package                       | `shared/types/`                                       |
| 3     | NestJS backend (11 modules)                | `services/backend/src/modules/`                       |
| 4     | Serial bridge (Node.js, SerialPort + mock) | `services/serial-bridge/`                             |
| 5     | AI predictor (FastAPI + YOLO/RF/VAE)       | `services/ai-predictor/`, `resources/models/`         |
| 6     | Veronica voice assistant (Python pipeline) | `apps/assistant/`                                     |
| 7     | Next.js dashboard + Atomic Design          | `apps/dashboard/`                                     |
| 8     | Arduino firmware (main + secondary)        | `firmware/main/`, `firmware/secondary/`               |
| 9     | Resources folder (models + media)          | `resources/`                                          |
| 10    | Docs set                                   | `docs/api-contracts.md`, `serial-protocol.md`, etc.   |

## Conventions still enforced

- Max 300 lines per file (GEMINI Rule 3)
- Never duplicate types across apps — use `shared/types/` only
- NestJS strict Module → Controller → Service per feature
- Atomic Design in `apps/dashboard/` and `apps/mobile/` (atoms → molecules → organisms)
- Branch per task, PR into `develop`
- Real `.env` never committed — only `.env.example`
- Mobile package versions **pinned** (`expo~54` + RN 0.81.5 + react 19.1.0)

## Remaining gaps

All captured in `docs/team-ownership.md` per-engineer sprint tables, not here.
Short summary:

- Real Arduino → backend end-to-end (Sarvar)
- DB migrations + Supabase production wiring (Maral)
- AI predictor GPU / readiness / ConvLSTM anomaly route (Firdavs)
- Mobile push notifications (Ismail)
- Dashboard camera / growth / alerts wiring (Maral + Hamidullah)
- Tests, CI, Docker, OTA, RBAC — none started yet
