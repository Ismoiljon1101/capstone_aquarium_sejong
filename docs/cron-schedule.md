# Fishlinic Cron Schedule

This document outlines the automated background tasks running in the `services/backend`.

## 1. Active Jobs

| Schedule | Method | Service | Purpose |
|---|---|---|---|
| Setiap Menit (`*/1 * * * *`) | `checkThresholds` | Sensors | Monitors water quality and triggers alerts. |
| Setiap 5 Menit (`*/5 * * * *`) | `runVisionAnalysis` | Vision | Captures snapshot and runs AI counting/behavior check. |
| Setiap 8 Jam (`0 */8 * * *`) | `triggerAutoFeed` | Actuators | Automated fish feeding sequence. |
| Setiap Jam 06:00 (`0 6 * * *`) | `dailyHealthReport` | Fish | Aggregates data into a daily health summary. |
| Setiap 30 Menit (`*/30 * * * *`) | `emergencyCheck` | Alerts | Deep check for critical safety conditions. |

---

## 2. Configuration
The schedule is defined in `services/backend/src/modules/cron/cron.service.ts` using the `@nestjs/schedule` decorators.
To disable a job, comment out the `@Cron` decorator for that method.
