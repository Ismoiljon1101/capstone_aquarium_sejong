# TECHNICAL DEBT REPORT
## Project: Fishlinic — Smart Aquaculture Monitoring System
## Document Type: Inherited Codebase Assessment
## Prepared by: App Development Lead (New Team)
## Date: 2026-04-03
## Status: Active — Working Document

---

> **Purpose of this document:**
> The previous Capstone team delivered a functional demo of the Fishlinic system.
> The new team has been assigned by the professor to continue and improve it.
> This document records all inherited technical debts, their severity, their exact
> location in the codebase, and the required action to resolve each one.
> It also defines the new features we are tasked with adding.
>
> This is not a complaint document. It is an engineering handoff record.

---

## SECTION 1: SYSTEM OVERVIEW (What We Inherited)

| Component | Technology | Location |
|---|---|---|
| Web Dashboard | Next.js 15, React 19, TypeScript, Tailwind v4 | `Dashboard-Code/` |
| Database | PostgreSQL via Prisma ORM | `Dashboard-Code/prisma/` |
| Auth System | NextAuth v4 (Credentials + Google + Kakao OAuth) | `app/lib/auth-config.ts` |
| Bridge Server | Express 5 + Socket.IO + SerialPort | `mock-server/index.ts` |
| AI Service | FastAPI (Python) + Heuristic predictor | `ai-service/` |
| Water Quality ML | Random Forest Regression (Jupyter Notebook) | `WaterReport-Code/` |
| Disease Detection | YOLOv8/YOLOv11 fine-tuned via Roboflow | `FishDisease-Training-Code/` |
| Anomaly Detection | ConvLSTM-VAE (PyTorch) | `ConvLSTM_VAE-code/` |
| Virtual Assistant | Python + Tkinter GUI + LLM voice interface | `VirtualAssistant-code/` |
| Hardware | 2x Arduino boards (pH/DO, Temp/Servo) | `arduino-code/` |

---

## SECTION 2: INHERITED TECHNICAL DEBTS

### SEVERITY SCALE
- P1 CRITICAL: Breaks production reliability or security
- P2 HIGH: Causes architectural problems that block future work
- P3 MEDIUM: Reduces maintainability and scalability
- P4 LOW: Code quality, style, naming, documentation

---

### P1 CRITICAL DEBTS

---

#### DEBT-001: Password Hashing is Base64, Not bcrypt

**File:** `app/lib/auth-config.ts` Lines 13-21

**Evidence:**
```typescript
function hashPassword(password: string): string {
  // Simple hash for demo - REPLACE with bcrypt in production
  return Buffer.from(password).toString("base64");
}
```

**Impact:**
Base64 is not hashing — it is encoding. Any attacker who gains database read access
can decode every user password instantly.
The comment says "REPLACE with bcrypt in production." This IS in production.

**Fix Required:**
Replace with `bcryptjs` or `argon2`. Add salt rounds >= 12.
All existing passwords in DB must be re-hashed on next login (migration strategy needed).

---

#### DEBT-002: "AI Model" is a Heuristic Function, Not a Trained ML Model

**File:** `ai-service/colab_model.py` Lines 50-75, `ai-service/predictor.py` Line 49

**Evidence from `colab_model.py`:**
```python
class ColabPredictor:
    """
    Currently mirrors the dashboard scoring and status logic for deterministic outputs.
    Swap internals with Colab pipeline to match training-time behavior exactly.
    """
    def predict_one(self, pH, temp_c, do_mg_l):
        status = status_for_reading(ph, t, dox)   # rule-based if/else
        quality = compute_overall_score(ph, t, dox) # weighted math formula
        return quality, status
```

**Evidence from `predictor.py` line 49:**
```python
fish_score = clamp(0.8, 0.0, 1.0)  # ALWAYS 0.8. Hardcoded constant forever.
```

**Impact:**
The ColabPredictor does not load any trained `.pkl` or `.joblib` file.
It calls the same rule-based math functions as the heuristic fallback.
The fish_score used in the quality calculation is always 0.8 — a hardcoded constant —
meaning fish health contributes a static 18% weight regardless of actual readings.
The Random Forest model trained in the Jupyter Notebook is NOT connected to this service.
The AI service is a heuristic calculator presenting itself as a trained model.

**Fix Required:**
Load the actual trained `.pkl` model from `WaterReport-Code/`.
Replace `compute_overall_score()` with `model.predict([[ph, temp_c, do_mg_l]])`.
Load model once at startup. Store as module-level singleton.
Remove the hardcoded `fish_score = clamp(0.8, 0.0, 1.0)`.

---

#### DEBT-003: Three Conflicting, Unsynchronized Data Stores

**Files:** `mock-server/index.ts`, `app/hooks/useTelemetry.ts`, `prisma/schema.prisma`

**Evidence — actual data flow:**
```
Arduino
  --> Bridge Server
        --> JSONL files on disk      <-- Dashboard reads history from HERE
        --> In-memory buffer (200 entries, LOST on restart)
        --> (never writes to PostgreSQL)

PostgreSQL (Prisma)
  --> Stores User accounts, FeederSchedule, FeedLog
  --> Has a Telemetry table (lines 50-73 schema.prisma) -- NEVER WRITTEN TO
```

**Impact:**
- Telemetry data is permanently lost every time the bridge server restarts
- JSONL files accumulate on disk with no retention policy or cleanup
- The database schema was designed for telemetry storage but is completely bypassed
- Historical data has no indexes, no pagination, no filtering at DB level
- Data cannot be associated with a specific user unless read from DB

**Fix Required:**
Bridge must POST each enriched reading to `POST /api/telemetry/ingest` (Next.js/Prisma).
Dashboard reads from `GET /api/telemetry/history` (Prisma).
JSONL becomes an optional local backup only.

---

#### DEBT-004: Silent AI Failure — No Fallback Indicator in UI

**File:** `mock-server/index.ts` Line 332

**Evidence:**
```typescript
try {
  const res = await fetch(`${AI_BASE_URL}/predict`, { ...signal... });
  if (res.ok) { /* enrich with AI fields */ }
} catch {}   // Empty catch. No log. No flag. No socket emit. Nothing.
```

**Impact:**
When the Python AI service is down (crash, port mismatch, timeout):
- Bridge silently returns raw telemetry without `quality_ai` or `status_ai`
- Dashboard renders: `quality_ai ?? computeOverallScore(latest)` — falls back silently
- User sees a score. It is the local heuristic. They believe it is the AI model.
- No visual indicator anywhere. No warning. No system health flag.

**Fix Required:**
Add `ai_status: "online" | "offline" | "degraded"` field to telemetry payload.
Bridge emits `ai:status` socket event when AI service fails.
Dashboard shows AI service state in System Health panel.

---

#### DEBT-005: Rate Limiter Uses In-Memory Map — Not Safe for Production

**File:** `app/lib/rate-limit.ts` Lines 24-25

**Evidence:**
```typescript
// In-memory store: IP -> Map<ruleKey, window>
const rateLimitStore = new Map<string, Map<string, RateLimitWindow>>();
```

**Impact:**
Next.js on Vercel runs as stateless serverless functions.
Each function invocation gets a fresh process.
The `rateLimitStore` Map is re-created on every cold start.
The rate limiter provides zero protection under real serverless deployment.

**Fix Required:**
Replace with Redis-backed rate limiting using `@upstash/ratelimit` (Vercel-compatible)
or `ioredis` + `rate-limiter-flexible` for self-hosted deployments.

---

### P2 HIGH PRIORITY DEBTS

---

#### DEBT-006: Bridge Server is a 559-Line God-File

**File:** `mock-server/index.ts` — 559 lines

**All responsibilities mixed in one file:**
- Express app setup + CORS middleware
- Socket.IO server initialization
- JSONL file I/O utilities
- Serial port auto-detection + Windows path normalization
- Serial data normalization (the `normalize()` function)
- Mock data generation + interval management
- AI enrichment HTTP calls with timeout
- In-memory ring buffer management
- REST API route handlers (6 endpoints)
- WebSocket event broadcasting
- Server startup + serial retry loop

**Fix Required:**
```
bridge-server/src/
  app.ts
  server.ts
  routes/
    history.routes.ts
    live.routes.ts
    mock.routes.ts
    ports.routes.ts
  services/
    serial.service.ts
    mock.service.ts
    ai.service.ts
    telemetry.service.ts
  utils/
    normalize.ts
    file-storage.ts
    serial-utils.ts
```
Rename folder from `mock-server` to `bridge-server`.

---

#### DEBT-007: Dashboard Page is 645 Lines

**File:** `app/dashboard/page.tsx` — 645 lines

**All crammed into one component:**
- 10+ useState declarations
- 4 useMemo blocks for derived data
- 3 useCallback handlers
- 2 useEffect hooks
- Connection status and hardware status calculation logic (30+ lines)
- Full JSX: header, main sections, sidebar, footer, 4 modals

**Fix Required:**
```
app/dashboard/
  page.tsx                        -- max 60 lines
  _hooks/useDashboardState.ts     -- all state
  _hooks/useConnectionInfo.ts     -- connection computation
  WaterQualitySection.tsx
  TrendAnalysisSection.tsx
  HardwareSidePanel.tsx
  RecentMeasurementsSection.tsx
```

---

#### DEBT-008: Virtual Assistant (Veronica) Has No Web Presence

**File:** `VirtualAssistant-code/virtual_assistant/gui_manager.py` — 51,677 bytes

**Impact:**
Veronica is a standalone Python Tkinter desktop application.
She has no HTTP API. No WebSocket server. No REST endpoints.
There is no bridge between her and the Next.js dashboard.
The `AskAIModal` in the dashboard connects to an LLM directly — it is NOT Veronica.
They are two completely separate programs with no shared code or interface.

**Fix Required:**
Strip GUI from `gui_manager.py` into headless `veronica_service.py`.
Add FastAPI routes: `POST /ask`, `GET /status`, `POST /command`.
Create `app/api/assistant/route.ts` in Next.js to proxy to Veronica.
Update `AskAIModal.tsx` to stream real responses from the Veronica FastAPI service.

---

#### DEBT-009: Zero Tests Across the Entire Codebase

**Evidence:**
```
*.test.ts  --> 0 files found
*.spec.ts  --> 0 files found
*.test.py  --> 0 files found
pytest.ini --> not found
vitest.config --> not found
jest.config --> not found
```

**Impact:**
A system that controls live fish feeding schedules and generates health alerts
has no automated verification of any kind.
The `normalize()` function (all hardware data passes through it) is untested.
The `status_for_reading()` logic (determines "alert" vs "good") is untested.
The auth password verification logic is untested.

**Fix Required:**
- Vitest for TypeScript (bridge + Next.js)
- pytest for Python (ai-service + predictor)
- Playwright for E2E (login -> dashboard -> data display)
- Minimum 80% coverage on `normalize()`, `status.ts`, `predictor.py`

---

#### DEBT-010: No Atomic Design — Components Are a Flat Dump

**Directory:** `app/components/` — 25 files, 0 subdirectories

**Oversized components:**

| File | Size | Problem |
|---|---|---|
| TelemetryChart.tsx | 20,134 bytes | Chart, tooltip, legend, animation, type switching in one file |
| TelemetryTable.tsx | 15,272 bytes | Rendering, sorting, filtering, status coloring in one file |
| SiteNav.tsx | 11,096 bytes | Desktop nav, mobile menu, user dropdown, theme toggle in one file |
| FeederPanel.tsx | 11,254 bytes | Schedule CRUD, feed logs, servo control, timer in one file |
| SimpleGame.tsx | 9,341 bytes | A JavaScript game inside a fish health monitoring system |

**Fix Required:**
```
app/components/
  atoms/       -- Button, Badge, StatusChip, ThemeToggle, SafeImage
  molecules/   -- MetricToggle, QuickStatsCard, StatusCard, Gauge
  organisms/   -- TelemetryChart, TelemetryTable, CameraPanel, FeederPanel, SiteNav
  modals/      -- ExportDataModal, AlertSettingsModal, AskAIModal, SettingsModal
  layout/      -- ProtectedPage, AlertBanner, VerificationBanner
```
All files must be under 300 lines. Split oversized components accordingly.

---

### P3 MEDIUM PRIORITY DEBTS

---

#### DEBT-011: No `loading.tsx` or `error.tsx` on Any Route

Next.js App Router supports automatic loading and error boundary UI.
None exist in this project. Routes flash blank during navigation.
Errors show a generic unhandled crash screen.

**Affects:** `app/dashboard/`, `app/vassistant/`, `app/settings/`, `app/profile/`

---

#### DEBT-012: Alert Thresholds Stored in Client-Only localStorage

Alert thresholds (pH min/max, DO min, temp range) live in the browser's localStorage.
Lost when switching devices. Cannot be managed server-side. Multi-device usage is broken.

**Fix Required:**
Add `alert_config` table to Prisma schema.
Persist and read via `app/api/settings/alerts/route.ts`.

---

#### DEBT-013: JWT Access Token Uses Math.random() — Not Cryptographically Secure

**File:** `app/lib/auth-config.ts` Line 255

**Evidence:**
```typescript
accessToken: `bearer_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
```

`Math.random()` is not a cryptographically secure random number generator.
It should never be used for security tokens.

**Fix Required:**
```typescript
import { randomBytes } from "crypto";
accessToken: randomBytes(32).toString("hex")
```

---

#### DEBT-014: Duplicate Socket Events on Every Telemetry Reading

**File:** `mock-server/index.ts` Lines 499-500

**Evidence:**
```typescript
io.emit("telemetry", enriched);
io.emit("telemetry:update", enriched);
```

Same data emitted twice. `useTelemetry.ts` subscribes to both events (lines 126-132).
Every reading is processed twice by the hook.

**Fix Required:** Standardize on one event name. Remove the duplicate.

---

#### DEBT-015: No Bundle Analysis or Code Splitting

ECharts is ~1MB unpacked. Loaded on every page. No `next/dynamic` anywhere.
No `React.lazy + Suspense` for heavy modals or panels.
No `@next/bundle-analyzer` installed or configured.

---

#### DEBT-016: `Chat_History` Uses Inconsistent ID Type

**File:** `prisma/schema.prisma` Line 76

```prisma
model Chat_History {
  id  Int  @id @default(autoincrement())  // Int, autoincrement
```

Every other model uses `String @id @default(cuid())`.
Inconsistent ID types are a future migration and cross-join problem.

---

#### DEBT-017: `allowDangerousEmailAccountLinking: true` in Google OAuth

**File:** `app/lib/auth-config.ts` Line 178

This flag allows automatic account merging between Google OAuth and credential accounts
sharing the same email. This is a documented account-takeover attack vector.
NextAuth explicitly names it "Dangerous."

**Fix Required:** Remove the flag. Implement an explicit account linking confirmation flow.

---

### P4 LOW PRIORITY DEBTS

---

#### DEBT-018: console.log in Production Code
Debug logs throughout bridge server and hooks. Remove or replace with `pino` logger.

#### DEBT-019: Personal Portfolio Links Hardcoded in Dashboard Footer
Author's personal LinkedIn, GitHub, and portfolio URL are in the production dashboard footer.
Move to an `/our-team` or `/about` page.

#### DEBT-020: `requirements.txt` Has No Pinned Versions
`pip install -r requirements.txt` 6 months from now will install different versions.
Pin all: `fastapi==0.115.x`, `uvicorn==0.34.x`, etc.

#### DEBT-021: Mini-Game Embedded in Health Monitoring Dashboard
`SimpleGame.tsx` (9KB) is rendered on the dashboard loading screen.
Not appropriate for a medical-grade monitoring system. Delete or isolate to `/playground`.

#### DEBT-022: `.env.example` Is Incomplete
Missing: OPENAI_API_KEY equivalent, Kakao credentials docs, AI_BASE_URL deployment guidance.
Python AI service has no `.env.example` at all.

---

## SECTION 3: NEW FEATURES TO ADD

---

### FEATURE-001: Connect Real Trained ML Model
The Random Forest model from the Jupyter Notebook must be loaded in `ai-service/`.
Export `.pkl` from Jupyter. Update `predictor.py` to call `model.predict()`.
Remove all hardcoded `fish_score = 0.8`. Add model versioning.

### FEATURE-002: Veronica Web API Integration
Headless FastAPI service for the VA. Proxy in Next.js. Streaming responses in UI.
Voice input via Web Speech API (browser-native, replaces Tkinter).

### FEATURE-003: Mobile Companion App (Expo)
Expo app sharing the same auth/DB. Live telemetry, push alerts, quick feed button.

### FEATURE-004: Historical Analytics and Reporting
Fix DEBT-003 first. Then: weekly/monthly aggregation, downloadable PDF reports,
anomaly timeline chart, CSV/PDF export with `@react-pdf/renderer`.

### FEATURE-005: Multi-User Multi-Tank Support
Add `Tank` model to Prisma. Per-tank telemetry, alerts, feeding schedules.
Role-based access: OWNER / OPERATOR / VIEWER.

### FEATURE-006: Production Notification Pipeline
Web Push API. Email webhook for CRITICAL alerts. Alert history page.
Severity: INFO / WARNING / CRITICAL. Snooze. DB-backed preferences (fixes DEBT-012).

### FEATURE-007: Live Disease Detection in Dashboard
Serve YOLO model via FastAPI `vision-service/`. Run inference on camera frames.
Display disease confidence scores in dashboard sidebar. Alert on threshold breach.

### FEATURE-008: ConvLSTM-VAE Anomaly Detection Live Feed
Load trained `.pth` model in a service. Feed live telemetry sliding window.
Display anomaly reconstruction error in TrendAnalysis chart.
Trigger alert when error exceeds learned threshold.

---

## SECTION 4: EXECUTION ORDER

```
Phase 1 (Weeks 1-2): Security and Correctness
  DEBT-001  bcrypt password hashing
  DEBT-013  crypto.randomBytes for JWT tokens
  DEBT-017  Remove dangerous email account linking
  DEBT-005  Redis-backed rate limiter
  DEBT-002  Connect real trained ML model

Phase 2 (Weeks 3-5): Architecture
  DEBT-006  Refactor bridge server into modules
  DEBT-007  Decompose dashboard page component
  DEBT-010  Apply Atomic Design to all components
  DEBT-003  Prisma as single telemetry data source
  DEBT-014  Remove duplicate socket events

Phase 3 (Weeks 6-7): Quality
  DEBT-009  Add Vitest + pytest + Playwright tests
  DEBT-011  Add loading.tsx and error.tsx per route
  DEBT-012  Move alert thresholds to database
  DEBT-015  Bundle analysis + code splitting
  DEBT-004  AI status indicator in System Health UI

Phase 4 (Weeks 8-12): New Features
  FEATURE-001  Real ML model integration
  FEATURE-002  Veronica web API
  FEATURE-006  Notification pipeline
  FEATURE-004  Historical reporting
  FEATURE-007  Live disease detection
  FEATURE-008  ConvLSTM-VAE live anomaly feed
  FEATURE-005  Multi-tank support
  FEATURE-003  Mobile app

Phase 5 (Week 12): Final Cleanup
  DEBT-016 through DEBT-022
  Lighthouse audit (target > 90 mobile)
  README.md update + .env.example completion
  Tag release v1.0.0
```

---

## SECTION 5: DEBT SUMMARY

| ID | Description | Severity | Effort |
|---|---|---|---|
| DEBT-001 | Password is Base64, not hashed | P1 Critical | 2h |
| DEBT-002 | AI model is heuristic not trained ML | P1 Critical | 1 day |
| DEBT-003 | 3 unsynced data stores | P1 Critical | 3 days |
| DEBT-004 | Silent AI failure, no UI indicator | P1 Critical | 4h |
| DEBT-005 | In-memory rate limiter not prod-safe | P1 Critical | 4h |
| DEBT-006 | 559-line bridge God-file | P2 High | 1 week |
| DEBT-007 | 645-line dashboard God-component | P2 High | 3 days |
| DEBT-008 | Veronica VA not integrated into web | P2 High | 1 week |
| DEBT-009 | Zero tests anywhere | P2 High | 1 week |
| DEBT-010 | No Atomic Design, flat component dump | P2 High | 2 days |
| DEBT-011 | No loading.tsx or error.tsx on routes | P3 Medium | 3h |
| DEBT-012 | Alert thresholds in localStorage | P3 Medium | 4h |
| DEBT-013 | JWT token uses Math.random() | P3 Medium | 1h |
| DEBT-014 | Duplicate socket events | P3 Medium | 1h |
| DEBT-015 | No bundle splitting or analysis | P3 Medium | 3h |
| DEBT-016 | Chat_History uses Int ID inconsistently | P3 Medium | 30min |
| DEBT-017 | allowDangerousEmailAccountLinking: true | P3 Medium | 2h |
| DEBT-018 | console.log in production | P4 Low | 2h |
| DEBT-019 | Personal links in production footer | P4 Low | 30min |
| DEBT-020 | requirements.txt unpinned versions | P4 Low | 30min |
| DEBT-021 | Game in health monitoring dashboard | P4 Low | 30min |
| DEBT-022 | .env.example incomplete | P4 Low | 1h |

**Total debts: 22**
**Estimated time to resolve all P1+P2: 4-5 weeks**
**Estimated time to resolve all: 6-8 weeks**

---

*Document maintained by App Development Lead.*
*Update as debts are resolved. Mark completed items with strikethrough.*
*Last updated: 2026-04-03*
