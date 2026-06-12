# Fishlinic — Core Code Review Report

**Scope**: `services/backend` (NestJS), `apps/mobile` (Expo/React Native), `shared/types`. Dashboard, serial-bridge, and ai-predictor are out of scope for this pass.

**Branch**: `develop` | **Date**: 2026-06-11

**Methodology**: Seven parallel, read-only audits covering Backend Core (sensors/actuators/serial/gateway/database/bootstrap), Fish & Vision modules, the Voice/Agent ("Veronica") subsystem, Management/Alerts/Cron/Push, the mobile `FishHealthScreen.tsx`, the remaining mobile screens/components, and cross-cutting type/contract consistency. Each finding was independently verified against source (`git diff`, grep, direct reads) before inclusion. Findings actively hunt for runtime bugs, broken functionality, and security/production risks — not just style.

---

## Executive Summary

**Total findings: 6 Critical, 15 High, 26 Medium, 24 Low (71 total).**

The single highest-priority issue is that **`services/backend/tsconfig.json` is currently invalid JSON** (an uncommitted stray `ç` character was prepended to the file), which means `pnpm dev`, `nest build`, and `tsc` all fail immediately — **the backend cannot currently start or build**. This must be fixed before anything else.

Beyond that build-breaker, the audit surfaced several issues that undermine the system's core value proposition as a *safety-monitoring* aquarium system:

- A startup task **permanently deletes all CO2 sensor history on every boot** (Critical data loss).
- The **`EMERGENCY` alert severity is never produced** and **push notifications are never wired up anywhere** — the system's highest-severity safety alert path is entirely dead, with no notification reaching the user if they're not watching the app.
- **`POST /voice/agent/confirm`** lets any network client trigger the feeder/pump/LEDs directly, bypassing Veronica's confirmation flow entirely — a real remote-actuation security hole.
- On native (iOS/Android), **`SettingsScreen`'s persistence layer is a complete no-op** — every setting (safe ranges, agent mode, TTS, alerts) silently reverts on remount/restart.
- The voice assistant has a **STT/TTS feedback-loop risk** with no hard cap on consecutive auto-resumed turns, which can spiral into Veronica responding to her own echo indefinitely.

On top of these, there is significant **type/contract drift** between `shared/types` and `apps/mobile/src/hooks/useSocket.ts` (locally-redeclared types missing `EMERGENCY` severity and several canonical fields), a **DB migration that's missing two columns** an entity declares (breaks Postgres deployments that don't rely on `synchronize`), and **~64 stale compiled `.js`/`.d.ts` files** committed alongside TypeScript sources in `services/backend/src`.

None of the 7 agents found evidence of SQL injection, exposed secrets in source, or XSS-style issues in the reviewed scope. The dominant security theme instead is **missing authentication/authorization on state-mutating endpoints** that control physical hardware (feeder, pump, LEDs).

---

## Top 10 Risks (Ranked)

| # | Severity | Finding | Area |
|---|----------|---------|------|
| 1 | Critical | `tsconfig.json` is invalid JSON — backend cannot build or start | [A.1](#a1-critical-tsconfigjson-has-invalid-json--breaks-all-builds) |
| 2 | Critical | Startup seed task deletes all CO2 sensor history on every boot | [A.2](#a2-critical-startup-seed-task-deletes-all-co2-sensor-readings-on-every-boot) |
| 3 | Critical | `EMERGENCY` severity never produced; push notifications never wired up — top-tier safety alerts are silently dropped | [D.1](#d1-critical-emergency-severity-is-never-produced--emergency-alerts-are-silently-downgraded-and-never-push-notified) |
| 4 | Critical | `/voice/agent/confirm` lets any client trigger actuators with no validation/auth | [C.1](#c1-critical-voiceagentconfirm-lets-any-caller-trigger-actuators-without-going-through-the-agents-proposal-flow) |
| 5 | Critical | STT/TTS feedback loop has no hard cap — Veronica can talk to herself indefinitely | [E.1](#e1-critical-stttts-feedback-loop--mic-restarts-while-tts-may-still-be-speaking-with-no-signal-based-guard) |
| 6 | Critical | `SettingsScreen` persistence is a no-op on iOS/Android — all settings silently revert | [F.1](#f1-critical-settingsscreen-persistence-is-a-no-op-on-iosandroid--all-toggles-silently-dont-save) |
| 7 | High | `HealthReport` entity has columns missing from the only migration — breaks Postgres (`synchronize:false`) deployments | [A.3](#a3-high-healthreport-entity-has-columns-missing-from-the-only-migration--breaks-synchronize-false-postgres-deployments) |
| 8 | High | No dedup/cooldown between sensor-threshold alerts and scheduler emergency checks — duplicate alert spam | [D.4](#d4-high-no-idempotencylock-between-sensorsservicesavereading-threshold-alerts-and-schedulerservicecheckemergency--duplicate-alert-spam-for-the-same-condition) |
| 9 | High | `ControlsScreen` pump/LED toggles report success even when the backend call fails | [F.3](#f3-high-controlsscreen-pumpled-toggles-show-success-even-when-the-backend-call-fails) |
| 10 | Medium* | `legacy.controller.ts` exposes unauthenticated `/feed`, can trigger the physical feeder from any network client | [A.5](#a5-medium-legacycontrollerts-exposes-top-level-history-latest-status-feed-schedule-routes-with-no-auth-and-a-no-op-schedule-endpoint) |

\*Ranked into the Top 10 despite Medium severity because it's an unauthenticated endpoint with a real-world physical side effect (feeder actuation).

---

## Scores

### Production-Readiness: 28/100
The backend currently **cannot build** due to the `tsconfig.json` corruption (#1) — by definition not production-ready in its current working-tree state. Even past that, a core data-retention bug (#2), a completely dead top-severity alert/notification path (#3), and a settings screen that doesn't persist anything on mobile (#6) mean the three pillars of an aquarium *safety* product — reliable history, emergency notification, and configuration — are each broken in a way a user would notice within a day of use.

### Security: 32/100
No SQL injection, no secrets-in-source, and the *normal* Veronica agent flow correctly gates actuator calls behind `CONFIRMATION_TOOLS` + `agentMode='confirm'`. However, multiple **unauthenticated endpoints directly control physical hardware**: `/voice/agent/confirm` (#4), `legacy.controller.ts`'s `/feed` (#10), and `PATCH /management/tank-config` (which can also be used to hijack the single global `pushToken`, per D.5). There is no auth/guard layer anywhere in the reviewed backend modules. For a system that drives motors/relays, this is a meaningful score depressor.

### Performance: 61/100
No catastrophic performance bugs. Issues found are mostly missing HTTP timeouts (voice/LLM calls, C.2), `setInterval`-based scheduler ticks that can overlap under load (D.5), uncancellable 45s vision requests (E.3), and several `useEffect`/`useMemo` cleanups that leak timers harmlessly. None of these cause outages under normal load, but they compound under degraded network conditions.

### Maintainability: 47/100
The codebase follows a consistent module/atomic-design structure, and several "recent rewrite" diffs (fish/vision services) are clean. However, there's pervasive **type drift** — `SensorReading` is independently redefined three times across `shared/types`, `useSocket.ts`, and `useSensors.ts` — plus ~64 stale compiled `.js`/`.d.ts` files committed in `src/`, a tracked SQLite binary that's always "modified", an unused `database.config.ts` that's out of sync with the real entity list, dead controllers (`CronController`), and an `ApiResponse<T>` shared type with zero usages.

---

## Findings by Area

## A. Backend Core — Sensors / Actuators / Serial / Gateway / Database / Bootstrap

**Files reviewed**: `services/backend/src/modules/{sensors,actuators,serial,gateway,database}/**/*.ts`, `services/backend/src/{main.ts,app.module.ts,app.service.ts,app.controller.ts}`, `services/backend/tsconfig.json`, `services/backend/.env.example`, all 13 entities, the single migration file.

**Tally**: 2 Critical, 3 High, 4 Medium, 5 Low

### A.1 [CRITICAL] tsconfig.json has invalid JSON — breaks all builds
- **File**: `services/backend/tsconfig.json`
- **Function/Component**: top of file (L1)
- **Category**: Code Quality / Broken Functionality
- **Lines**: L1
- **Explanation**: `git diff` shows the first line was changed from `{` to `ç{` — a stray non-ASCII character was prepended, making the file invalid JSON.
- **Why it fails**: `tsc -p tsconfig.json`, `nest build`, and `pnpm dev` (which runs `nest start`) all parse this file with `JSON.parse`/`jsonc-parser`; a leading `ç` causes a parse error and the command fails immediately, blocking the entire backend from starting or building.
- **Repro steps**:
  1. `cd services/backend`
  2. `pnpm dev` (or `pnpm exec tsc -p tsconfig.json --noEmit`)
  3. Observe immediate parse error / failure to load tsconfig.
- **Recommended fix**: Remove the stray `ç` character so the file starts with `{`.
- **Patch**:
```diff
--- a/services/backend/tsconfig.json
+++ b/services/backend/tsconfig.json
@@ -1,4 +1,4 @@
-ç{
+{
   "compilerOptions": {
     "module": "nodenext",
     "moduleResolution": "nodenext",
```

### A.2 [CRITICAL] Startup seed task deletes all CO2 sensor readings on every boot
- **File**: `services/backend/src/modules/database/seed.ts`
- **Function/Component**: `seedDatabase` (CO2 cleanup block), in conjunction with `services/backend/src/modules/sensors/sensors.simulator.ts` (`tick`) and `services/backend/src/modules/sensors/sensors.service.ts` (`saveReading`)
- **Category**: Backend Issues / Data Loss
- **Lines**: seed.ts L60-73; simulator L43-64 (writes `type: 'CO2'` every 8s); sensors.service.ts L22-57
- **Explanation**: `seedDatabase()` runs `DELETE FROM "sensor_readings" WHERE UPPER("type") = 'CO2'` on every application startup ("Clean up ghost CO2 data"), but `SensorsSimulator` and the real serial bridge actively persist `type: 'CO2'` readings as part of the normal 4-sensor set (`pH`, `temp_c`, `do_mg_l`, `CO2`). `SensorsService.getLatest()` and `checkThresholds()` also explicitly query for `CO2` as a first-class sensor type.
- **Why it fails**: Every restart of the backend permanently deletes all historical CO2 readings from the database (real ones too, not just "ghost" data from some prior bad migration). Anyone using `/sensors/:id/readings?range=1m` for CO2, or building a CO2 trend chart, will silently lose all history older than the current run. This looks like leftover one-time cleanup code that was never removed and is now actively destructive against a sensor type that's part of the supported set.
- **Repro steps**:
  1. Let the backend run with `SIMULATE_SENSORS` enabled for a few minutes (CO2 rows accumulate in `sensor_readings`).
  2. Restart the backend (`pnpm dev` again, triggers `DatabaseService.onModuleInit` → `seedDatabase`).
  3. Query `GET /sensors/4/readings?range=1m` (CO2 sensorId=4) immediately after restart — all rows from before the restart are gone (only rows written after the new `tick()` calls remain).
- **Recommended fix**: Remove the CO2 cleanup block entirely (it appears to target a one-time historical bug that's no longer applicable), or gate it behind a one-time migration/flag instead of running unconditionally on every startup.
- **Patch**:
```diff
--- a/services/backend/src/modules/database/seed.ts
+++ b/services/backend/src/modules/database/seed.ts
@@ -57,18 +57,6 @@ export async function seedDatabase(dataSource: DataSource): Promise<void> {
       logger.log('LightSchedule already populated.');
     }
 
-    // 3. Clean up ghost CO2 data if any exists
-    try {
-      const queryRunner = dataSource.createQueryRunner();
-      await queryRunner.connect();
-      // Ensure the table exists before attempting to query
-      const tableExists = await queryRunner.hasTable('sensor_readings');
-      if (tableExists) {
-        await queryRunner.query(`DELETE FROM "sensor_readings" WHERE UPPER("type") = 'CO2'`);
-        logger.log('Cleaned up any legacy ghost CO2 sensor readings.');
-      }
-      await queryRunner.release();
-    } catch (e) {
-      logger.warn(`Could not run CO2 ghost data cleanup: ${e.message}`);
-    }
-
     logger.log('Database seeding checks completed successfully.');
   } catch (error) {
     logger.error('Failed to check or seed database:', error.stack || error.message);
```

### A.3 [HIGH] HealthReport entity has columns missing from the only migration — breaks `synchronize: false` (Postgres) deployments
- **File**: `services/backend/src/modules/database/entities/health-report.entity.ts` and `services/backend/src/migrations/1716300000000-InitialMigration.ts`
- **Function/Component**: `HealthReport` entity (L26-30) vs `up()` `health_reports` CREATE TABLE (L60-78)
- **Category**: Backend Issues / Code Quality
- **Lines**: health-report.entity.ts L26-30; InitialMigration.ts L60-78
- **Explanation**: The `HealthReport` entity declares `behaviorLabel: string` (nullable varchar) and `behaviorConfidence: number` (nullable float), but the `health_reports` table created by the only existing migration does not include these two columns.
- **Why it fails**: When `DATABASE_URL` points at Postgres, `database.module.ts` sets `synchronize: false` and relies solely on migrations. After running migrations, the `health_reports` table will lack `behaviorLabel`/`behaviorConfidence`. Any TypeORM query (`save`, `find`, `createQueryBuilder`) referencing those columns will throw `column "behaviorLabel" does not exist`, breaking the health-report write/read path used by the vision/fish-health behavior analysis flow (per the recent "feat: wire video behavior analysis into veronica" commit).
- **Repro steps**:
  1. Set `DATABASE_URL` to a real Postgres connection (non-placeholder), run migrations (`migrationsRun: true` on boot).
  2. Trigger a health report write that sets `behaviorLabel`/`behaviorConfidence` (e.g., via the fish/vision behavior analysis flow).
  3. TypeORM throws a Postgres error: `column "behaviorLabel" of relation "health_reports" does not exist`.
- **Recommended fix**: Add a new migration (e.g., `ALTER TABLE "health_reports" ADD COLUMN "behaviorLabel" varchar, ADD COLUMN "behaviorConfidence" double precision`) rather than relying on `synchronize`.
- **Patch**:
```diff
--- /dev/null
+++ b/services/backend/src/migrations/1750000000000-AddBehaviorColumnsToHealthReports.ts
@@ -0,0 +1,13 @@
+import { MigrationInterface, QueryRunner } from 'typeorm';
+
+export class AddBehaviorColumnsToHealthReports1750000000000 implements MigrationInterface {
+  name = 'AddBehaviorColumnsToHealthReports1750000000000';
+
+  public async up(queryRunner: QueryRunner): Promise<void> {
+    await queryRunner.query(`ALTER TABLE "health_reports" ADD COLUMN "behaviorLabel" varchar`);
+    await queryRunner.query(`ALTER TABLE "health_reports" ADD COLUMN "behaviorConfidence" double precision`);
+  }
+
+  public async down(queryRunner: QueryRunner): Promise<void> {
+    await queryRunner.query(`ALTER TABLE "health_reports" DROP COLUMN "behaviorConfidence"`);
+    await queryRunner.query(`ALTER TABLE "health_reports" DROP COLUMN "behaviorLabel"`);
+  }
+}
```

### A.4 [HIGH] `synchronize: true` is used for SQLite even with a real, non-Postgres `DATABASE_URL` — masks migration drift
- **File**: `services/backend/src/modules/database/database.module.ts`
- **Function/Component**: `TypeOrmModule.forRootAsync` factory, L35-66
- **Category**: Backend Issues / Code Quality
- **Lines**: L35-66
- **Explanation**: The factory only sets `synchronize: false` for the Postgres branch (L46-58). Both the "no DATABASE_URL / placeholder" branch (L36-44) and the "non-Postgres DATABASE_URL" branch (L60-66) use `synchronize: true` against the local `fishlinic.sqlite` file.
- **Why it fails**: With `synchronize: true`, TypeORM auto-creates/alters tables from entity metadata on every boot, which is how the schema drift in A.3 (`HealthReport.behaviorLabel`/`behaviorConfidence`) goes unnoticed in local/SQLite dev — the table is silently patched at runtime — but breaks the moment the same code runs against the migration-managed Postgres path. This is a "works on my machine, breaks in prod" trap, and risks accidental destructive auto-migrations against the SQLite file (e.g., column drops/renames TypeORM infers as drop+recreate).
- **Repro steps**:
  1. Run `pnpm dev` against the local SQLite DB — note `health_reports` works fine because `synchronize: true` silently added `behaviorLabel`/`behaviorConfidence`.
  2. Point `DATABASE_URL` at Postgres and run migrations only.
  3. Same code path now throws (see A.3) — the SQLite dev environment never surfaced this.
- **Recommended fix**: Either keep `synchronize: true` only for ephemeral/test setups, or — better — write the missing migration(s) (A.3) and run migrations against SQLite too so dev and prod schemas stay in lock-step.
- **Patch**:
```diff
--- a/services/backend/src/modules/database/database.module.ts
+++ b/services/backend/src/modules/database/database.module.ts
@@
-        return {
-          type: 'sqlite',
-          database: 'fishlinic.sqlite',
-          entities: [...],
-          synchronize: true,
-        };
+        return {
+          type: 'sqlite',
+          database: 'fishlinic.sqlite',
+          entities: [...],
+          migrations: [__dirname + '/../../migrations/*.{ts,js}'],
+          migrationsRun: true,
+          synchronize: false,
+        };
```

### A.5 [HIGH] `POST /actuators/feed` silently drops the `duration` parameter from the request body
- **File**: `services/backend/src/modules/actuators/actuators.controller.ts`
- **Function/Component**: `triggerFeeder`, L9-18
- **Category**: Backend Issues / Broken Functionality
- **Lines**: L9-18
- **Explanation**: The handler accepts `@Body() body: { duration: number; userId?: string }` but never reads `body.duration` — it always sends a hardcoded `triggerActuator({ actuatorId: 1, type: 'FEEDER', relayChannel: 1, state: true, source: 'APP' })` to the serial bridge with no duration/portion info.
- **Why it fails**: Any client (mobile app) that calls `POST /actuators/feed` with `{ duration: 5000 }` expecting a 5-second feed pulse gets the same fixed-duration (or indefinite-on, depending on serial-bridge default) feed regardless of the requested value. Combined with `ActuatorCommand` (shared type) having no `duration` field at all, this looks like a feature that was wired up on the client but never connected end-to-end on the backend/type level — feeding duration cannot be controlled from the API today.
- **Repro steps**:
  1. `curl -X POST http://localhost:3000/actuators/feed -H "Content-Type: application/json" -d '{"duration": 5000}'`
  2. Observe the serial-bridge command sent has no `duration`/`cycles` field — identical to calling with `{}`.
- **Recommended fix**: Either add `duration`/`portionSec` to `ActuatorCommand` (shared/types) and forward it to the serial bridge, or document that feed duration is not configurable via this endpoint and remove the unused `duration` from the body type to avoid misleading API consumers.
- **Patch**:
```diff
--- a/services/backend/src/modules/actuators/actuators.controller.ts
+++ b/services/backend/src/modules/actuators/actuators.controller.ts
@@
   async triggerFeeder(@Body() body: { duration?: number; userId?: string }) {
     return this.actuators.triggerActuator({
       actuatorId: 1,
       type: 'FEEDER',
       relayChannel: 1,
       state: true,
+      duration: body?.duration,
       source: 'APP',
     });
   }
```
  (Requires adding `duration?: number` to `ActuatorCommand` in `shared/types/actuator.types.ts` and forwarding it in `ActuatorsService.triggerActuator` → serial-bridge payload.)

### A.6 [MEDIUM] `database.config.ts` is dead code and out of sync with the real entity list
- **File**: `services/backend/src/modules/database/database.config.ts`
- **Category**: Code Quality
- **Explanation**: This file is never imported anywhere in `services/backend/src` (confirmed via grep — only the stale compiled `.js` twin references it). The actual DB config logic is duplicated and re-implemented inline in `database.module.ts`. `databaseEntities` here only lists 8 of the 13 entities — if it were ever wired in it would silently exclude 5 tables.
- **Recommended fix**: Delete `database.config.ts` (and its stale `.js`/`.d.ts` artifacts), since `database.module.ts` already contains the canonical (and more complete) config logic.

### A.7 [MEDIUM] `legacy.controller.ts` exposes top-level `/history`, `/latest`, `/status`, `/feed`, `/schedule` routes with no auth and a no-op `/schedule` endpoint
- **File**: `services/backend/src/modules/database/legacy.controller.ts`
- **Category**: Security / Backend Issues
- **Explanation**: This controller registers root-level routes (`@Controller()` with no prefix) duplicating `/sensors/latest`, `/sensors/:id/readings`, and `/actuators/feed` for backward compatibility. None of these routes have any authentication/authorization guard — `POST /feed` can trigger the physical feeder actuator from any client that can reach the backend. `POST /schedule` is a complete no-op — it just echoes back `{ status: 'scheduled', ...body }` without persisting anything to `FeedScheduleEntity`/`LightScheduleEntity`.
- **Recommended fix**: Add auth (even a simple API key/shared secret check) to actuator-triggering endpoints, and either implement `/schedule` against `FeedScheduleEntity`/`LightScheduleEntity` or remove/mark it deprecated with a clear "not implemented" response. (See also Top-10 #10.)

### A.8 [MEDIUM] `SerialController.handleCommand`/`SerialService.sendCommand` has no error handling — unhandled promise rejection surfaces as raw 500
- **File**: `services/backend/src/modules/serial/serial.service.ts`, `services/backend/src/modules/serial/serial.controller.ts`
- **Category**: Runtime Bugs
- **Explanation**: `sendCommand` does `firstValueFrom(this.http.post(...))` with no try/catch. If the serial-bridge (`SERIAL_BRIDGE_URL`, default `http://localhost:3001`) is unreachable, this throws and `handleCommand` doesn't catch it either — Nest's default exception filter returns a generic `500` with a potentially URL-leaking Axios error message. Compare with `ActuatorsService.triggerActuator`, which wraps the same kind of call in try/catch and returns `{ success: false }`.
- **Recommended fix**: Wrap the `firstValueFrom` call in try/catch (mirroring `ActuatorsService.getState`/`triggerActuator`) and return a structured error response instead of letting the exception propagate.

### A.9 [MEDIUM] Inconsistent sort order between `/sensors/history` (DESC) and `/sensors/:id/readings` (ASC)
- **File**: `services/backend/src/modules/sensors/sensors.service.ts`
- **Function/Component**: `getHistory` (L72-79) vs `getAllHistory` (L81-88)
- **Category**: Backend Issues / Code Quality
- **Explanation**: `getHistory(sensorId, range)` (used by `GET /sensors/:id/readings`) orders by `timestamp: 'ASC'`, while `getAllHistory(range)` (used by `GET /sensors/history`, called by `apps/mobile/src/hooks/useApi.ts`) orders by `timestamp: 'DESC'`.
- **Recommended fix**: Standardize both endpoints on the same order (likely `ASC` for time-series chart consumption), or document the difference clearly in both methods.

### A.10 [LOW] ~64 stale compiled `.js`/`.js.map`/`.d.ts` files committed alongside TS sources, untracked and not gitignored
- **File**: `services/backend/src/**` (e.g., `database.config.js`, `migrations/1716300000000-InitialMigration.js`, etc.)
- **Category**: Code Quality
- **Explanation**: `git status --porcelain services/backend/src | grep '\.js$' | wc -l` returns **64** untracked `.js` files mixed into `src/` next to their `.ts` counterparts — stale build output, not source.
- **Recommended fix**:
```bash
find services/backend/src -name '*.js' -o -name '*.js.map' -o -name '*.d.ts' | xargs rm -f
```
  Then add to `.gitignore`:
```
services/backend/src/**/*.js
services/backend/src/**/*.js.map
services/backend/src/**/*.d.ts
```

### A.11 [LOW] `fishlinic.sqlite` tracked binary DB file shows as modified in git status
- **File**: `services/backend/fishlinic.sqlite`
- **Category**: Code Quality
- **Explanation**: The SQLite database file is tracked in git and shows as modified on every local run that writes sensor readings/alerts/etc., dirtying the working tree and risking commits of runtime data or merge conflicts on a binary file.
- **Recommended fix**: Add `services/backend/fishlinic.sqlite` (and `*.sqlite`/`*.sqlite-journal`) to `.gitignore`, `git rm --cached` the tracked copy, and rely on `seedDatabase()` for fresh-start defaults.

### A.12 [LOW] `.env.example` contains a real-looking Supabase project hostname in `DATABASE_URL`
- **File**: `services/backend/.env.example` (L7)
- **Category**: Security
- **Explanation**: `DATABASE_URL=postgresql://postgres:[password]@db.omkixcauinqpltbkfwvu.supabase.co:5432/postgres` — while the password is a placeholder, the hostname identifies a specific real Supabase project, disclosing the existence/identity of a cloud database instance in a typically widely-shared file.
- **Recommended fix**: Replace with a fully generic placeholder, e.g. `postgresql://user:pass@host:5432/dbname`.

### A.13 [LOW] `ActuatorsController.togglePump`/`toggleLed` default to `state = true` when body is omitted, contradicting "toggle" naming
- **File**: `services/backend/src/modules/actuators/actuators.controller.ts` (L20-32, L34-44)
- **Category**: Backend Issues
- **Explanation**: The code's own comment acknowledges this: "we should ideally fetch [current state] and toggle, but for now we default to true to at least prevent a crash." Calling `POST /actuators/pump` with an empty body always turns the pump ON, regardless of current state.
- **Recommended fix**: Fetch current actuator state (e.g., latest `ActuatorEventEntity` row per type) and invert it when `state` is omitted from the body.

### A.14 [LOW] `GatewayGateway`/`ActuatorsService` circular dependency is fragile; `system:notification` emit site is unwired
- **File**: `services/backend/src/modules/gateway/gateway.gateway.ts` (L40), `services/backend/src/modules/actuators/actuators.service.ts` (L16-26)
- **Category**: Code Quality
- **Explanation**: `GatewayGateway` constructor-injects `ActuatorsService` directly while `ActuatorsService` injects `GatewayGateway` back via `@Optional() @Inject(forwardRef(...))`. This works today because of the asymmetric `@Optional()`, but is fragile to future changes. Relatedly, `GatewayService.broadcastSystemNotification` (`gateway.service.ts` L15) emits `system:notification` but has zero callers anywhere in `services/backend/src` (cross-ref G.2).
- **Recommended fix**: Use `forwardRef()` symmetrically on both sides, or refactor so `ActuatorsService` emits via an event emitter that `GatewayGateway` subscribes to instead of a direct dependency.

---

## B. Fish & Vision Modules

**Files reviewed**: `services/backend/src/modules/fish/fish.{service,controller}.ts`, `services/backend/src/modules/vision/vision.{service,controller,module}.ts`, `shared/types/fish.types.ts`, related entities (`fish-count`, `health-report`, `fish-growth`, `camera-snapshot`).

**Tally**: 0 Critical, 1 High, 4 Medium, 3 Low

### B.1 [HIGH] Dangling `/vision/snapshots/:id/image` URL with no route handler
- **File**: `services/backend/src/modules/vision/vision.service.ts`
- **Function/Component**: `getLatestSummary` (L268-270), `getSnapshot` (L232-234)
- **Category**: Broken Functionality
- **Lines**: L228-275
- **Explanation**: `getLatestSummary()` returns `imagePath: /vision/snapshots/{id}/image` for the mobile app to load as an image URL, but no controller in `vision.controller.ts` (or anywhere else) registers a `GET /vision/snapshots/:id/image` route. `getSnapshot(snapshotId)` exists in the service but is never called from any controller — dead code that's the obvious intended handler.
- **Why it fails**: Any client (mobile `FishHealthScreen`) that calls `GET /vision/latest` and renders `imagePath` as `<Image source={{uri: API_BASE + imagePath}}>` gets a 404, since Nest has no matching route.
- **Repro steps**:
  1. Run a vision analysis (`POST /vision/analyze`) so a snapshot row exists.
  2. `GET /vision/latest` — observe `imagePath: "/vision/snapshots/3/image"`.
  3. `GET http://localhost:3000/vision/snapshots/3/image` — returns 404 Not Found.
- **Recommended fix**: Add a controller endpoint `GET /vision/snapshots/:id/image` that calls `visionService.getSnapshot(id)`, validates/resolves `snapshot.imagePath` against a fixed snapshot directory, and streams it back (e.g., `res.sendFile`).
- **Patch**:
```diff
--- a/services/backend/src/modules/vision/vision.controller.ts
+++ b/services/backend/src/modules/vision/vision.controller.ts
@@
-import { Controller, Post, Get, Body } from '@nestjs/common';
+import {
+  Controller,
+  Post,
+  Get,
+  Body,
+  Param,
+  ParseIntPipe,
+  NotFoundException,
+  Res,
+} from '@nestjs/common';
+import type { Response } from 'express';
+import * as path from 'path';
+import * as fs from 'fs';
 import { VisionService } from './vision.service';

 @Controller('vision')
 export class VisionController {
   constructor(private readonly visionService: VisionService) {}

   @Post('analyze')
   async analyze(@Body('triggeredBy') triggeredBy?: string) {
     return await this.visionService.runFullAnalysis(triggeredBy || 'MANUAL');
   }

   @Get('latest-report')
   async getLatestReport() {
     return await this.visionService.getLatestReport();
   }

   @Get('latest')
   async getLatest() {
     return this.visionService.getLatestSummary();
   }
+
+  @Get('snapshots/:id/image')
+  async getSnapshotImage(
+    @Param('id', ParseIntPipe) id: number,
+    @Res() res: Response,
+  ) {
+    const snapshot = await this.visionService.getSnapshot(id);
+    if (!snapshot) throw new NotFoundException('Snapshot not found');
+
+    const baseDir = path.resolve(process.env.SNAPSHOT_DIR ?? './snapshots');
+    const resolved = path.resolve(baseDir, path.basename(snapshot.imagePath));
+    if (!resolved.startsWith(baseDir) || !fs.existsSync(resolved)) {
+      throw new NotFoundException('Snapshot file not found');
+    }
+    return res.sendFile(resolved);
+  }
 }
```

### B.2 [MEDIUM] `getLatestSummary`'s `confidence` field uses fish-count confidence as a proxy for disease confidence
- **File**: `services/backend/src/modules/vision/vision.service.ts`
- **Function/Component**: `getLatestSummary` (L237-275)
- **Category**: Backend Issues
- **Explanation**: The returned `confidence` is `latestCount?.confidence ?? 0.97`, i.e. the *fish-count* model's confidence — but `disease` is derived from `report.visualStatus`, not `report.mlConfidence` (the actual disease-classification confidence). The `disease`+`confidence` pairing is therefore semantically inconsistent.
- **Recommended fix**: Use `report?.mlConfidence ?? latestCount?.confidence ?? 0.97` so `confidence` actually corresponds to the `disease` field being reported.

### B.3 [MEDIUM] Hardcoded disease-label mapping is dead code — wired to the wrong field
- **File**: `services/backend/src/modules/vision/vision.service.ts`
- **Function/Component**: `getLatestSummary` (L253-262), `mapDiseaseStatus` (L294-302)
- **Category**: Code Quality / Backend Issues
- **Explanation**: `report?.visualStatus` is typed/stored as `'ok' | 'warn' | 'critical'`, yet this code compares it against strings like `'HF Healthy Fish'`, `'BD Bacterial Disease'`, etc. — values `mapDiseaseStatus()` never produces. These branches are unreachable; `diseaseName` always falls through to the literal `"ok"`/`"warn"`/`"critical"` string. The intended mapping (translating the AI predictor's raw label) appears to have been wired to `visualStatus` instead of `diseaseClass`.
- **Recommended fix**: Map from `report?.diseaseClass` (the raw AI label) instead of `report?.visualStatus`, and use `visualStatus` only for the separate ok/warn/critical badge.

### B.4 [MEDIUM] Path traversal risk in future snapshot file serving (latent, tied to B.1)
- **File**: `services/backend/src/modules/vision/vision.service.ts`
- **Function/Component**: `requestSnapshot` (L41-60), `getSnapshot` (L232-234)
- **Category**: Security
- **Explanation**: `snapshot.imagePath` is stored verbatim from the serial-bridge's HTTP response (L53) with no validation. If the missing image-serving endpoint (B.1) is implemented naively (e.g. `path.join(baseDir, imagePath)`), a compromised/misbehaving serial-bridge could supply `../../etc/passwd` and cause arbitrary file disclosure.
- **Recommended fix**: When implementing snapshot serving, validate `imagePath` is a bare filename (`path.basename`) and resolve+containment-check against a fixed snapshot directory before reading. (The B.1 patch above already includes this guard.)

### B.5 [MEDIUM] `FishCount`/`HealthReport` entity shapes leak directly to clients and don't match `shared/types`
- **File**: `services/backend/src/modules/fish/fish.service.ts` (`getLatestCount` L164-170, `getLatestReport` L172-178), `fish.controller.ts`
- **Category**: Backend Issues / Code Quality
- **Explanation**: `shared/types/fish.types.ts` defines `FishCount { count, timestamp, snapshotId }` (no `confidence`/`countId`) and `FishHealthReport { reportId, ..., createdAt }` (no `timestamp`). The controller returns the raw TypeORM entities, which have extra fields (`countId`, `confidence`) and use `timestamp` instead of `createdAt` for the health report — a field-name mismatch vs the shared `FishHealthReport` interface.
- **Recommended fix**: Map entity → DTO matching `FishCount`/`FishHealthReport` before returning (rename `timestamp`→`createdAt` for health report), or update `shared/types/fish.types.ts` to match actual entity field names — confirm which side (`FishHealthScreen.tsx`) is the actual consumer first.

### B.6 [LOW] `find({take:1})[0] ?? null` refactor is functionally equivalent to prior `findOne({where:{}})` — no regression
- **File**: `services/backend/src/modules/fish/fish.service.ts` (`getLatestCount` L169, `getLatestReport` L177)
- **Category**: Code Quality
- **Explanation**: The recent diff changing `findOne({where:{}})` to `find({take:1})[0] ?? null` is a no-op behaviorally (both return `null` on empty table) — `order` + `take: 1` is actually more idiomatic. No fix needed; flagged only for completeness since this was a recently-touched area.

### B.7 [LOW] `requestSnapshot` does not validate `data.imagePath` is present before use
- **File**: `services/backend/src/modules/vision/vision.service.ts` (`requestSnapshot` L41-60)
- **Category**: Runtime Bugs
- **Explanation**: If the serial-bridge responds 200 with a malformed body (missing `imagePath`), `this.snapshotRepo.create({ imagePath: undefined, ... })` is saved — `imagePath` is a non-nullable column, so this could throw a SQLite NOT NULL constraint error with an unclear message.
- **Recommended fix**: Add `if (!data?.imagePath) throw new Error('Camera bridge returned no imagePath')` before constructing the snapshot entity.

### B.8 [LOW] AI predictor response fields read from untyped `any` with no schema validation
- **File**: `services/backend/src/modules/vision/vision.service.ts` (`runFullAnalysis` L127-191)
- **Category**: Code Quality
- **Explanation**: `disease.disease`, `count.count`, `behavior.label`/`status`, `quality.label`/`status`, etc. are all read from untyped `data: any` HTTP responses. A field-name change on the Python AI service would silently produce `undefined` everywhere, masked as "0% confidence, unknown disease" rather than an error.
- **Recommended fix**: Define response interfaces (`DiseaseDetectionResponse`, `FishCountResponse`, etc.) for the `this.http.post<T>(...)` calls, and/or add a runtime shape check (e.g. zod) at the boundary.

---

## C. Voice/Agent Subsystem ("Veronica")

**Files reviewed**: `services/backend/src/modules/voice/{agent.service,agent.tools,agent.types,agent.monitor,voice.service,voice.controller,voice.module}.ts`, plus `tank-config`, `chat-message`, `voice-session` entities, `actuators.service.ts`, `management.service.ts`.

**Tally**: 1 Critical, 1 High, 2 Medium, 2 Low

### C.1 [CRITICAL] `/voice/agent/confirm` lets any caller trigger actuators without going through the agent's proposal flow
- **File**: `services/backend/src/modules/voice/voice.controller.ts`
- **Function/Component**: `confirmAction` (L61-68), backed by `agent.service.ts` `executeConfirmedAction` (L164-221)
- **Category**: Security
- **Lines**: voice.controller.ts L61-68; agent.service.ts L164-221
- **Explanation**: `/voice/agent/confirm` accepts raw `tool`, `args`, and `sessionId` from the request body with zero validation that this corresponds to a `pendingAction` previously returned by `/voice/agent`, and no authentication/authorization guard. Any client that can reach the backend (CORS only restricts browser-originated requests, not curl/Postman/another LAN device) can call this endpoint directly to actuate the feeder, pump, or LEDs.
- **Why it fails**: `executeConfirmedAction` switches on `tool === 'controlPump' | 'controlLed' | 'triggerFeed'` and immediately calls `actuators.triggerActuator(...)` using values taken straight from the request body — there's no server-side state binding the confirmation to a prior agent proposal (no token/nonce/session check), and no DTO/`class-validator` constraints on `tool`/`args`.
- **Repro steps**:
  1. With the backend running and `agentMode = 'confirm'` (the default), do NOT call `/voice/agent` at all.
  2. `curl -X POST http://localhost:3000/voice/agent/confirm -H "Content-Type: application/json" -d '{"tool":"triggerFeed","args":{"state":true,"cycles":5}}'`
  3. Observe the feeder fires immediately, bypassing all of Veronica's "requires confirmation"/"sensor justification" logic and the `agentMode` check entirely (that check only happens inside `run()`, not in `executeConfirmedAction`).
- **Recommended fix**: Bind confirmations to a server-side pending-action record (persist `pendingAction` with a generated `confirmationId` + sessionId + expiry when `run()` returns it; require the client to echo `confirmationId` back to `/agent/confirm` and validate server-side). At minimum, validate `tool` against `CONFIRMATION_TOOLS` with a DTO/`class-validator` and add an auth guard to all `/voice/*` mutating routes.
- **Patch**:
```diff
--- a/services/backend/src/modules/voice/voice.controller.ts
+++ b/services/backend/src/modules/voice/voice.controller.ts
@@ -1,6 +1,7 @@
 import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
 import { randomUUID } from 'crypto';
 import { ConfigService } from '@nestjs/config';
+import { BadRequestException } from '@nestjs/common';
 import { VoiceService } from './voice.service';
 import { AgentService } from './agent.service';
 import type { ToolName } from './agent.types';
+import { CONFIRMATION_TOOLS } from './agent.tools';
@@ -60,10 +61,14 @@ export class VoiceController {
   // Agent: execute a confirmed write action
   @Post('agent/confirm')
   async confirmAction(
     @Body('tool') tool: ToolName,
     @Body('args') args: Record<string, unknown>,
     @Body('sessionId') sessionId?: string,
   ) {
+    if (!CONFIRMATION_TOOLS.has(tool)) {
+      throw new BadRequestException(`Tool ${tool} cannot be confirmed`);
+    }
+    // TODO: also verify (tool, args, sessionId) matches a pending action
+    // previously issued by /voice/agent for this session.
     return await this.agentService.executeConfirmedAction(tool, args, sessionId);
   }
```

### C.2 [HIGH] No HTTP timeout on LLM/actuator calls — a hung OpenRouter/Ollama/serial-bridge request can block indefinitely
- **File**: `services/backend/src/modules/voice/agent.service.ts`, `voice.service.ts`, `voice.module.ts`
- **Function/Component**: `callModel` (agent.service.ts L332-396), `chat` (voice.service.ts L215-252), `HttpModule` registration (voice.module.ts L19)
- **Category**: Performance
- **Lines**: voice.module.ts L19; agent.service.ts L336-359, L377-387; voice.service.ts L217-246
- **Explanation**: `HttpModule` is imported with no options (not `HttpModule.register({ timeout, ... })`), and `firstValueFrom(this.http.post(...))` calls have no `timeout()` operator anywhere in the voice module. Axios's default is no timeout.
- **Why it fails**: If OpenRouter or a local Ollama instance hangs, `callModel` never resolves or rejects. `run()`'s `while (iterations < MAX_ITERATIONS)` loop awaits `callModel` directly, so `/voice/agent` (and `/voice/query`) hangs until the client times out or the TCP connection drops. Each agent loop iteration can also call `vision.runFullAnalysis`, which itself does an HTTP call to the AI predictor with no timeout, compounding the risk across up to `MAX_ITERATIONS = 6` rounds.
- **Repro steps**:
  1. Set `LLM_PROVIDER`/`OLLAMA_URL` to point at a host that accepts the TCP connection but never responds (e.g., a `nc -l` listener).
  2. `POST /voice/agent` with any query.
  3. Request hangs indefinitely — no timeout fires, `aiOffline`/`sensorFallback` paths never trigger.
- **Recommended fix**: Add `HttpModule.register({ timeout: 15000 })` (or per-call `timeout()` + `catchError`) for OpenRouter/Ollama/predictor/serial-bridge calls, and treat timeout errors the same as connection errors (fall into the existing `catch` → `aiOffline: true`/`sensorFallback` path).
- **Patch**:
```diff
--- a/services/backend/src/modules/voice/voice.module.ts
+++ b/services/backend/src/modules/voice/voice.module.ts
@@ -17,7 +17,7 @@ import { FishModule } from '../fish/fish.module';
 @Module({
   imports: [
-    HttpModule,
+    HttpModule.register({ timeout: 20000 }),
     ConfigModule,
     TypeOrmModule.forFeature([VoiceSessionEntity, ChatMessageEntity]),
     SensorsModule,
```

### C.3 [MEDIUM] `triggerFeed` ignores `cycles` argument when actuating hardware but reports it succeeded
- **File**: `services/backend/src/modules/voice/agent.service.ts` (`executeConfirmedAction` L197-210)
- **Category**: Backend Issues
- **Explanation**: `cycles` is parsed and clamped (`Math.min(5, Math.max(1, Number(args.cycles) || 2))`) but never passed to `actuators.triggerActuator(...)` — `ActuatorCommand` has no `cycles` field, and `triggerActuator` performs a single state-change call. The response message says "Feeder triggered for {cycles} cycle(s)", misrepresenting what actually happened. (Same root cause as A.5 — `ActuatorCommand` lacks duration/cycles support.)
- **Recommended fix**: Either extend `ActuatorCommand`/serial-bridge protocol to accept `cycles` and forward it, loop `triggerActuator` calls `cycles` times, or change the response message to not claim a cycle count if unsupported.

### C.4 [MEDIUM] Actuator state always reported as OFF in `/voice/query` system prompt due to response shape mismatch
- **File**: `services/backend/src/modules/voice/voice.service.ts` (`handleQuery` L54-61)
- **Category**: Backend Issues
- **Explanation**: `handleQuery` casts `actuators.getState()` to `{ actuators?: { pump, led, feeder } }` and reads `actuatorResponse?.actuators`. But `ActuatorsService.getState()` returns the serial-bridge's `/status` payload directly, which (per its error-path shape `{status, message}`) doesn't appear to nest an `actuators` key — so `actuatorResponse?.actuators` is `undefined` and the code silently falls back to a hardcoded `{pump: false, led: false, feeder: false}`.
- **Recommended fix**: Verify the actual shape returned by the serial-bridge `/status` endpoint and update the destructuring/type accordingly, or have `ActuatorsService` expose a dedicated typed method that normalizes the actuator booleans.

### C.5 [LOW] Duplicated provider-selection/header-building logic between `voice.service.ts` and `agent.service.ts`
- **File**: `services/backend/src/modules/voice/voice.service.ts`, `agent.service.ts`
- **Category**: Code Quality
- **Explanation**: Both services independently read `OLLAMA_URL`, `OPENROUTER_BASE_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`/`OLLAMA_MODEL`, derive `llmProvider`, and build identical OpenRouter headers. `voice.controller.ts`'s `/voice/status` additionally reads `LLM_PROVIDER` directly — a third independent source of truth that neither service actually consults (both derive provider from whether `OPENROUTER_API_KEY` is set).
- **Recommended fix**: Extract a shared `LlmConfigService` providing `provider`, `model`, `chat(...)`, and headers, injected into both services; have `/voice/status` read from the same source.

### C.6 [LOW] Confirmation flow doesn't persist the user's "confirm" turn in chat history
- **File**: `services/backend/src/modules/voice/agent.service.ts` (`finishAction` L223-245)
- **Category**: Code Quality
- **Explanation**: When a pending action is confirmed via `/voice/agent/confirm`, `finishAction` saves only an `assistant` message ("OK ..."/"FAILED ..."), never recording that the user approved the action. Replaying `getSessionMessages` shows the assistant's proposal followed immediately by "OK Pump turned ON." with no visible user confirmation in between.
- **Recommended fix**: Persist a synthetic `user` message (e.g., "Confirmed.") before saving the result, or add a `pendingAction`/`confirmedAction` marker field to `ChatMessageEntity`.

**Positive notes**: All three state-mutating tools (`controlPump`, `controlLed`, `triggerFeed`) correctly route through `CONFIRMATION_TOOLS` in the *normal* `/voice/agent` flow, and `agentMode` defaults to `'confirm'` — the gap is specifically the unguarded `/agent/confirm` endpoint (C.1). `OPENROUTER_API_KEY` is never logged/returned (`/voice/status` only returns `hasKey: boolean`). No prompt-injection escalation path beyond normal LLM tool-use risk was found.

---

## D. Management / Alerts / Cron / Push

**Files reviewed**: `services/backend/src/modules/{management,alerts,cron,push}/**/*.ts`, plus cross-references to `shared/types/alert.types.ts`, `sensors.service.ts`, `actuators.service.ts`, and entities/migration.

**Tally**: 1 Critical, 3 High, 4 Medium, 3 Low

### D.1 [CRITICAL] EMERGENCY severity is never produced — emergency alerts are silently downgraded and never push-notified
- **File**: `services/backend/src/modules/management/scheduler.service.ts`
- **Function/Component**: `checkEmergency` (L106-132)
- **Category**: Backend Issues
- **Lines**: L125-131 (and `shared/types/alert.types.ts` L1, `alerts.service.ts` L18-35, `push.service.ts` whole file)
- **Explanation**: `AlertSeverity` defines `'EMERGENCY'` as the highest level, and `TankConfigEntity` has dedicated `emergency*` threshold fields plus `pushToken`/`pushEnabled` columns clearly intended for critical push notifications. However `checkEmergency()` — the only code path that reads these emergency thresholds — creates the alert with `severity: 'CRITICAL'`, not `'EMERGENCY'`. Grep across `services/backend/src/modules` shows `'EMERGENCY'` is never used as a `severity` value anywhere. Additionally, `AlertsService.createAlert` never calls `PushService.send` — `PushService` has zero callers in the entire backend.
- **Why it fails**: A user crossing the emergency thresholds (e.g., temp outside `[emergencyTempMin, emergencyTempMax]`) gets a `CRITICAL` alert via socket only. No push notification is ever sent, regardless of `pushToken`/`pushEnabled`, because nothing wires `PushService` to `AlertsService`/`SchedulerService`. If the user isn't watching the dashboard/app at that moment, they get zero notification of a tank emergency (e.g., DO crashing, temperature runaway) — defeating the purpose of the dedicated `EMERGENCY` tier and `emergency*` config fields.
- **Repro steps**:
  1. Set `tank_config.emergencyTempMax = 28` and `pushToken` to a valid Expo push token, `pushEnabled = true`.
  2. Push a `temp_c` sensor reading of `29`.
  3. Wait for the next scheduler tick (≤60s) — `checkEmergency()` fires and inserts an alert with `severity: 'CRITICAL'`, `type: 'EMERGENCY'`.
  4. Observe: socket `alert:new` fires (if the client is connected), but no push notification is sent — `PushService.send` is never invoked anywhere.
  5. `alerts` table never has a row with `severity = 'EMERGENCY'`, despite the type system declaring it as a distinct, presumably-highest tier.
- **Recommended fix**: (1) Use `severity: 'EMERGENCY'` in `checkEmergency()`. (2) Inject `PushService` into `SchedulerService` (it's `@Global()`, so importable without module wiring changes) and send a push using `cfg.pushToken` when `cfg.pushEnabled` and severity is `EMERGENCY`/`CRITICAL`.
- **Patch**:
```diff
--- a/services/backend/src/modules/management/scheduler.service.ts
+++ b/services/backend/src/modules/management/scheduler.service.ts
@@
 import { ManagementService } from './management.service';
 import { ActuatorsService } from '../actuators/actuators.service';
 import { SensorsService } from '../sensors/sensors.service';
 import { AlertsService } from '../alerts/alerts.service';
+import { PushService } from '../push/push.service';
@@
   constructor(
     private readonly mgmt: ManagementService,
     private readonly actuators: ActuatorsService,
     private readonly sensors: SensorsService,
     private readonly alerts: AlertsService,
+    private readonly push: PushService,
   ) {}
@@
     if (!issues.length) return;
 
-    await this.alerts.createAlert({
+    await this.alerts.createAlert({
       sensorId: 0,
       tankId: 1,
       type: 'EMERGENCY',
-      severity: 'CRITICAL',
+      severity: 'EMERGENCY',
       message: `Emergency: ${issues.join('; ')}`,
     });
+
+    if (cfg.pushEnabled && cfg.pushToken) {
+      await this.push.send(
+        cfg.pushToken,
+        'Tank Emergency',
+        issues.join('; '),
+        { type: 'EMERGENCY' },
+      );
+    }
   }
```

### D.2 [HIGH] `daysMask` uses local server time, not the user's tank/timezone — schedule day can shift relative to the user's intended timezone
- **File**: `services/backend/src/modules/management/scheduler.service.ts`
- **Function/Component**: `tick`/`checkFeedSchedules` (L46-79)
- **Category**: Runtime Bugs
- **Lines**: L46-53, L64-79
- **Explanation**: `dayBit = 1 << now.getDay()` and `currHHMM = hhmm(now)` resolve in the **server process's local timezone** (`TZ` env var or OS default), not necessarily the tank's/user's timezone. There is no `TZ` configuration anywhere in this module.
- **Why it fails**: If the backend (e.g., cloud deployment or a Pi with UTC system clock) runs in a different timezone than the user, a schedule set for "08:00 Monday" fires at 08:00 server time — a different wall-clock time and possibly a different day-of-week for the user. E.g., with `TZ=UTC` and a user in `Asia/Seoul` (UTC+9): a schedule for Monday 00:30 KST = Sunday 15:30 UTC. `now.getDay()` returns `0` (Sunday) → `dayBit=1`, but the Monday `daysMask` bit is `2`, so `2 & 1 = 0` — the schedule never fires on the day the user expects.
- **Repro steps**: (edge-condition; included for clarity)
  1. Deploy backend with `TZ=UTC`. User is in `Asia/Seoul` (UTC+9).
  2. User sets a feed schedule for `00:30` on Monday (`daysMask` bit = `1<<1 = 2`), intending Monday 00:30 KST.
  3. Monday 00:30 KST = Sunday 15:30 UTC → server computes `dayBit=1` (Sunday) → `2 & 1 = 0` → no match on the intended day.
- **Recommended fix**: Either (a) standardize all schedule storage/comparison on UTC and have the mobile app convert HH:MM/daysMask to UTC before saving, or (b) store an explicit tank timezone in `TankConfigEntity` and use a timezone-aware library (`date-fns-tz`/`luxon`) for both `hhmm()` and `getDay()`. Document the assumption and ensure deployment `TZ` matches it.

### D.3 [HIGH] `cron.service.ts`'s "deep emergency conditions check" is a dead no-op that overlaps with `scheduler.service.ts`'s real check
- **File**: `services/backend/src/modules/cron/cron.service.ts` (`checkEmergencyConditions` L108-112), `services/backend/src/modules/alerts/alerts.service.ts` (`checkEmergencyConditions` L51-54)
- **Category**: Code Quality / Backend Issues
- **Explanation**: `CronService` runs `checkEmergencyConditions` every 30 minutes (`@Cron('*/30 * * * *')`), logging "Performing deep emergency conditions check..." and delegating to `AlertsService.checkEmergencyConditions()`, which is a stub that does nothing but `return { status: 'safe' }`. Meanwhile, `SchedulerService.checkEmergency()` runs every 60 seconds and does the *actual* threshold checking against `TankConfigEntity.emergency*`.
- **Why it fails**: Anyone reading `cron.service.ts` would assume a periodic "deep" emergency check runs every 30 minutes; in reality it's a no-op, which risks someone removing the *actual* working check under the false belief that `cron.service.ts` already covers it.
- **Recommended fix**: Either implement `AlertsService.checkEmergencyConditions()` to do real work (consolidating with `SchedulerService.checkEmergency`'s logic), or remove the dead cron job entirely and rely solely on `SchedulerService`'s 60s tick. If kept for redundancy, document why and ensure no duplicate/conflicting alerts (see D.4).

### D.4 [HIGH] No idempotency/lock between `SensorsService.saveReading` threshold alerts and `SchedulerService.checkEmergency` — duplicate alert spam for the same condition
- **File**: `services/backend/src/modules/sensors/sensors.service.ts` (`saveReading` L22-57), `services/backend/src/modules/management/scheduler.service.ts` (`checkEmergency` L106-132)
- **Category**: Performance / Code Quality
- **Explanation**: Every time a sensor reading is saved with `status !== 'ok'` (hardcoded thresholds in `evaluateReading`, e.g. pH outside `[6.5, 8.0]` → `'critical'`), `saveReading` immediately creates a `CRITICAL`/`WARNING` alert. Independently, `SchedulerService.checkEmergency()` runs every 60 seconds and creates *another* `CRITICAL` "Emergency: ..." alert if the reading is outside the separately-configured `tank_config.emergency*` thresholds — with **no deduplication** and two different threshold sets/message formats.
- **Why it fails**: If a sensor pushes readings every few seconds while pH stays critically low, the `alerts` table fills with near-duplicate `CRITICAL` rows from two different code paths, with no debounce/cooldown (unlike `checkFeedSchedules`, which has a `lastFiredAt` 55s guard). This causes alert-table bloat and (if D.1's push wiring were added) would spam the user's phone every 60 seconds indefinitely.
- **Recommended fix**: Add a cooldown/debounce — track `lastAlertAt` per alert `type` (similar to `FeedScheduleEntity.lastFiredAt`) and skip creating a new alert if an unacknowledged alert of the same type was created within a configurable window (e.g., 15-30 min). Consolidate the two threshold systems into one source of truth.

### D.5 [MEDIUM] `lastLedState` is in-memory only — resets to `null` on every restart, causing redundant actuator commands
- **File**: `services/backend/src/modules/management/scheduler.service.ts` (`checkLightSchedule` L82-96, field at L23)
- **Category**: Runtime Bugs
- **Explanation**: `lastLedState: boolean | null = null` is a process-local field. On every restart, this resets to `null`, so the next tick always sends an actuator command (since `null !== shouldBeOn`), even if the LED is already in the correct state — minor actuator wear/log noise. If a schedule transition happens during a restart window, the transition is delayed until the next tick after restart.
- **Recommended fix**: Persist last commanded LED state (e.g., a column on `TankConfigEntity`, or query `ActuatorEventEntity` for the most recent `LED_STRIP` event) instead of relying on an in-memory flag.

### D.6 [MEDIUM] `checkFeedSchedules` 55s debounce vs 60s tick interval — tight margin, and `setInterval` allows overlapping ticks
- **File**: `services/backend/src/modules/management/scheduler.service.ts` (`checkFeedSchedules` L64-79)
- **Category**: Runtime Bugs
- **Explanation**: The tick runs via `setInterval(..., 60000)`, which does **not** guarantee non-overlapping execution — if a tick's `Promise.all` (including an `axios.post` to the serial bridge with no timeout) takes long enough, the next tick can start before the previous finishes. The 5-second debounce margin (55s vs 60s) is tight relative to that potential delay.
- **Recommended fix**: Replace `setInterval` with a self-rescheduling `setTimeout` that only schedules the next tick after the current one completes, and add a timeout to the `axios.post` call in `triggerActuator`.

### D.7 [MEDIUM] `PushService.send` supports only one global token — `PATCH /management/tank-config` lets any client overwrite/hijack it
- **File**: `services/backend/src/modules/push/push.service.ts` (`send` L9-30), `services/backend/src/modules/management/management.controller.ts` (`updateConfig`)
- **Category**: Code Quality / Security
- **Explanation**: `tank_config` has exactly one `pushToken` (singleton row), meaning the system supports exactly **one** registered device, system-wide, with no auth tying a token to a user. `ManagementController.updateConfig` (`PATCH /management/tank-config`) accepts `Partial<TankConfigEntity>` with no `@UseGuards` anywhere in `management.controller.ts` — any client that can reach the backend can overwrite `pushToken` to register their own device, displacing the previous owner.
- **Recommended fix**: Add authentication/authorization to `management.controller.ts` PATCH endpoints (or at minimum the `pushToken` field), and/or route `pushToken` registration through a dedicated authenticated "register device" endpoint. If multi-user support is intended, move `pushToken` to a separate `devices`/`users` table with ownership.

### D.8 [MEDIUM] `getLightSchedule`/`getTankConfig` race-condition fallback can return `undefined` via a lying `row!` non-null assertion
- **File**: `services/backend/src/modules/management/management.service.ts` (`getLightSchedule` L49-59, `getTankConfig` L68-78)
- **Category**: Runtime Bugs
- **Explanation**: Both methods use a try/insert-or-refetch pattern: if `save()` throws (assumed unique-constraint race), they re-`findOne` and assert `row!` non-null. If `save()` throws for a different reason (DB connection error, schema mismatch) and the refetch also legitimately returns `null`, `row!` lies to TypeScript and the function returns `undefined` at runtime — causing a `TypeError` inside `tick()`'s `Promise.all` (caught by the top-level `.catch`, so the process doesn't crash, but the tick's checks fail with an unhelpful generic error).
- **Recommended fix**: Check `error instanceof QueryFailedError` (TypeORM) and only treat unique-violation errors as the race case; for other errors, rethrow. Replace `row!` with an explicit check that throws a descriptive error if still `null` after refetch.

### D.9 [LOW] `CronController` is an empty dead controller
- **File**: `services/backend/src/modules/cron/cron.controller.ts`
- **Category**: Code Quality
- **Explanation**: `CronController` is registered in `CronModule` but has no routes/methods — pure scaffold leftover.
- **Recommended fix**: Remove the controller and its registration in `cron.module.ts`, or add a debug endpoint (e.g., manually trigger the weekly export) if that was the intent.

### D.10 [LOW] `fishGrowthMonitor` hardcodes a growth-rate multiplier (`* 2.1`) with no documented basis
- **File**: `services/backend/src/modules/cron/cron.service.ts` (`fishGrowthMonitor` L64-75, magic number L70)
- **Category**: Code Quality
- **Explanation**: `this.fish.saveGrowthRecord(result.count.count * 2.1, result.count.count)` — `2.1` (presumably grams per fish) is unexplained and hardcoded, conflating fish count with estimated total weight via an arbitrary constant.
- **Recommended fix**: Move the constant to `TankConfigEntity` (configurable per species/tank) or a named constant with a comment explaining the unit/assumption.

### D.11 [LOW] `AlertsController` has no cleanup endpoint — `alerts` table grows unbounded
- **File**: `services/backend/src/modules/alerts/alerts.controller.ts`, `alerts.service.ts` (`listAlerts` L37-44)
- **Category**: Performance
- **Explanation**: `listAlerts` always `take: 50`, and there's no retention/cleanup mechanism for old acknowledged alerts. Combined with D.4 (potential alert spam), the `alerts` table can grow indefinitely.
- **Recommended fix**: Add a periodic cron job (`cron.service.ts`) to delete acknowledged alerts older than N days, or add a `DELETE /alerts/:id`/bulk-cleanup endpoint.

**Notes on items that checked out fine**: Feed schedule CRUD is functionally correct; `inWindow()` overnight-range logic for the light schedule is correct including the always-off edge case; `daysMask` bit convention (`bit 0 = Sunday`, matching `Date.getDay()`) is internally consistent — the only timezone issue is cross-timezone drift (D.2), not the bitmask encoding itself.

---

## E. Mobile — `FishHealthScreen.tsx` (2391 lines)

**Files reviewed**: `apps/mobile/src/screens/FishHealthScreen.tsx` in full (helper hooks/components L1-908: `useSpeechRecognition`, `VoiceOrb`, `ReasoningTerminal`, `Bubble`, `useTypewriter`, `TypewriterBubble`; main component body L909-2391), cross-checked against `useApi.ts`/`useSocket.ts`/`useSensors.ts`.

**Tally**: 1 Critical, 4 High, 5 Medium, 3 Low

### E.1 [CRITICAL] STT/TTS feedback loop — mic restarts while TTS may still be speaking, with no signal-based guard
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx`
- **Function/Component**: `askVeronica` (TTS completion callback) / `startListening`
- **Category**: Broken Functionality
- **Lines**: L1264-1282, L1287-1324
- **Explanation**: After `speakText` finishes, the code waits 250ms then calls `startListening()` if `callRef.current && !loadingRef.current`. On mobile, `expo-speech`'s `onDone`/`onError` callbacks can fire even while audio is still draining from the speaker (especially Bluetooth/AirPlay output), and there's no check for whether the device's speaker output is still active. `expo-speech` doesn't enable acoustic echo cancellation (AEC).
- **Why it fails**: 250ms is a heuristic, not based on actual audio hardware state. On many Android device speaker+mic combos, this gap is insufficient, so the mic captures the tail end of Veronica's own voice as new "user" input, triggering `askVeronica` again with echoed text — an unbounded conversational loop.
- **Repro steps**:
  1. Run on a physical Android device with speaker output (no headphones).
  2. Start a voice call (`toggleCall`), ask a question.
  3. Veronica's TTS response finishes; 250ms later `startListening()` fires.
  4. Device mic picks up the tail/echo of the speaker output as `final` transcript.
  5. `askVeronica` is called again with the echoed text, generating a new response, spoken again, picked up again — the loop continues. Critically, `listenRetryRef.current = 0` resets on any successful recognition (`got=true`, even if it's an echo) at L1293, so there's **no bound** on this loop.
- **Recommended fix**: Increase the debounce significantly (800-1200ms) and/or track actual TTS playback completion more robustly; consider muting STT input-gain detection during TTS, or requiring push-to-talk. At minimum, add a maximum consecutive-auto-resume counter independent of `got` to break true infinite loops.
- **Patch**:
```diff
@@ const startListening = useCallback(() => {
+  // Guard against runaway echo loops: cap consecutive auto-triggered turns
+  const MAX_AUTO_TURNS = 6;
   if (!callRef.current || !sr.supported) return;
```
  (Full fix requires a separate counter incremented in `askVeronica` on STT-triggered calls and reset only on manual user interaction — a larger structural change beyond this one-line guard.)

### E.2 [HIGH] `useTypewriter` pending commit can append a stale reply out of order if a second message is sent mid-animation
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx`
- **Function/Component**: `useTypewriter` (L830-856), `TypewriterBubble` (L859-907), usage at L1677, `askVeronica` (L1242-1257)
- **Category**: Performance / Frontend Issues
- **Lines**: L834-853, L1241-1257, L1677
- **Explanation**: `setLoading(false)` happens at L1258, *before* the typewriter `setTimeout` (which commits `reply` to `msgs`) resolves at L1243-1257. This creates a window where `loading=false` but the previous typewriter commit hasn't fired yet. A second `askVeronica` call during this window calls `setAnimatingMsg(replyB)` (overwriting the orb mid-animation for replyA), while the old `setTimeout` for replyA is still scheduled and will fire later, pushing the **stale first reply** into `msgs` — potentially after the user's second message.
- **Why it fails**: No tracked/cancellable handle for the typewriter timeout means two concurrent "commit to msgs" operations can interleave out of chronological order.
- **Repro steps**:
  1. Send message A. Wait for `loading` to flip to `false` (happens once the typewriter timeout is *scheduled*, not after it fires).
  2. Within `Math.max(600, Math.min(1600, replyA.length*14))` ms (up to 1.6s), quickly send message B.
  3. `setAnimatingMsg(replyB)` overwrites the orb showing `replyA`'s typewriter mid-animation.
  4. Both `setTimeout`s eventually fire: replyA commits to `msgs` (out of chronological order relative to the user's message B, already pushed), then replyB commits.
  5. `msgs` shows Veronica's replyA appearing *after* the user's second question — a misordered/duplicated-looking response.
- **Recommended fix**: Track a "typewriter timeout" ref; when a new `askVeronica` call starts, `clearTimeout` any pending timeout from the previous call (optionally flushing the stale `reply` into `msgs` immediately first).
- **Patch**:
```diff
+  const typewriterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
@@
       // Typewriter: show animating version, then commit to msgs when done
+      if (typewriterTimeoutRef.current) {
+        clearTimeout(typewriterTimeoutRef.current);
+        typewriterTimeoutRef.current = null;
+      }
       setAnimatingMsg(reply);
-      setTimeout(
+      typewriterTimeoutRef.current = setTimeout(
         () => {
           setAnimatingMsg(null);
           setMsgs((p) => [
             ...p,
             { role: "veronica", text: reply, ts: new Date(), imageUrl: visionImageUrl },
           ]);
+          typewriterTimeoutRef.current = null;
         },
         Math.max(600, Math.min(1600, reply.length * 14)),
       );
```

### E.3 [HIGH] `refreshVision` has no `AbortController` — 45s vision request can't be cancelled, and `visionLoading` can get stuck if it never resolves
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx`
- **Function/Component**: `refreshVision` (L1034-1053)
- **Category**: Broken Functionality / Performance
- **Lines**: L1034-1053
- **Explanation**: `api.analyzeVision("MOBILE_REFRESH")` is a 45-second-timeout POST with no `AbortSignal` (and `useApi.analyzeVision` doesn't accept one). If the user navigates away while a vision scan is in flight, the request continues for up to 45s; on resolve/reject, `setVisionScan`/`setVisionError`/`setVisionLoading(false)` fire on an unmounted component.
- **Why it fails**: More importantly, if the backend never responds and axios's timeout doesn't reliably fire on React Native's fetch-based polyfill for a hung TCP connection, `visionLoading` stays `true` forever, permanently disabling the "Refresh Scan" button (`disabled={visionLoading}` at L1543) with no user-facing retry.
- **Repro steps**:
  1. Point the app at a backend that accepts the `/vision/analyze` connection but never responds (hung TCP).
  2. Tap "Refresh Scan".
  3. `visionLoading` stays `true` indefinitely; the button remains disabled with no error and no way to retry without restarting the app.
- **Recommended fix**: Add an `AbortController` to `refreshVision`, wire it through `useApi.analyzeVision(triggeredBy, signal)`, abort on unmount via a `useEffect` cleanup, and add a client-side hard-timeout fallback (e.g., force `setVisionLoading(false)` + error after 50s).
- **Patch**:
```diff
+  const visionAbortRef = useRef<AbortController | null>(null);
   const refreshVision = useCallback(async () => {
     if (visionLoading) return;
     setVisionLoading(true);
     setVisionError("");
+    visionAbortRef.current?.abort();
+    const ctrl = new AbortController();
+    visionAbortRef.current = ctrl;
     try {
-      const r = await api.analyzeVision("MOBILE_REFRESH");
+      const r = await api.analyzeVision("MOBILE_REFRESH", ctrl.signal);
       setVisionScan(r.data ?? null);
       if (typeof r.data?.count?.count === "number") {
         setFishCount(r.data.count.count);
       }
     } catch (err: any) {
+      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
       setVisionError(
         err?.response?.data?.detail ?? err?.response?.data?.error ?? "Vision scan failed.",
       );
     } finally {
       setVisionLoading(false);
     }
   }, [visionLoading]);
+
+  useEffect(() => () => visionAbortRef.current?.abort(), []);
```
  (Also requires updating `analyzeVision` in `useApi.ts` to accept and pass a `signal` parameter.)

### E.4 [HIGH] `askVeronica` reads sensor/fishCount/TTS state via closure, which can be stale by several seconds during a long voice utterance
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx`
- **Function/Component**: `askVeronica` (L1178-1285), `startListening` (L1287-1324)
- **Category**: Frontend Issues / Runtime Bugs
- **Lines**: L1284, L1324, L1291-1322
- **Explanation**: `askVeronica`'s dependency array is `[sensors, fishCount, ttsEnabled]`. `sensors` (from `useSensors()`) gets a new object reference on every `sensor:update` socket event (every few seconds). `SpeechRecognition.onresult`/`onend` (registered inside `startListening`) close over the `askVeronica` reference *at the time `startListening` was called* — if sensor data updates mid-utterance, that closure becomes stale relative to current `sensors`/`fishCount`/`ttsEnabled`.
- **Why it fails**: `sensorContext(sensors, fishCount)` inside the stale closure uses the sensor snapshot from before the update — for a long utterance, Veronica may report several-seconds-old pH/temp/DO values as "live", which matters for an aquarium assistant near alert thresholds.
- **Repro steps**:
  1. Start voice call; begin speaking a long question.
  2. While speaking, a `sensor:update` socket event arrives, recreating `askVeronica`/`startListening`.
  3. `SpeechRecognition.onresult` (registered with the *old* `askVeronica`) fires when speech ends, calling the stale closure.
  4. `sensorContext(...)` in the stale closure uses sensor values from before the update — Veronica may report outdated readings as "live".
- **Recommended fix**: Use refs for `sensors`/`fishCount`/`ttsEnabled` (mirroring the existing `sessionIdRef`/`callRef`/`loadingRef` pattern) so `askVeronica` always reads current values and can have a stable empty dependency array.
- **Patch**:
```diff
+  const sensorsRef = useRef(sensors);
+  sensorsRef.current = sensors;
+  const fishCountRef = useRef(fishCount);
+  fishCountRef.current = fishCount;
+  const ttsEnabledRef = useRef(ttsEnabled);
+  ttsEnabledRef.current = ttsEnabled;
@@
-      const ctx = sensorContext(sensors, fishCount);
+      const ctx = sensorContext(sensorsRef.current, fishCountRef.current);
@@
       const shouldSpeak =
-        ttsEnabled && (callRef.current || Platform.OS !== "web");
+        ttsEnabledRef.current && (callRef.current || Platform.OS !== "web");
@@
-    [sensors, fishCount, ttsEnabled],
+    [],
```

### E.5 [HIGH] `FishVisionCard` (rendered inside this screen) calls non-existent `api.triggerVisionScan`
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx` (usage at L1493) and `apps/mobile/src/components/organisms/FishVisionCard.tsx` (L38)
- **Category**: Runtime Bugs
- **Lines**: L1493 (FishHealthScreen.tsx); FishVisionCard.tsx L38
- **Explanation**: `FishVisionCard.tsx`'s `handleRefresh` calls `api.triggerVisionScan()`, but `useApi.ts` exports no `triggerVisionScan` (only `analyzeVision`, `getFishVision`, `getLatestVisionReport`). Calling `api.triggerVisionScan()` throws `TypeError: api.triggerVisionScan is not a function` synchronously inside `handleRefresh`'s `try` block.
- **Why it fails**: Caught by the surrounding `catch`, logged to console, `setLoading(false)` runs — fails silently from the UI's perspective. The card's own refresh control does nothing, separate from `FishHealthScreen`'s working "Refresh Scan" button (E.3).
- **Repro steps**:
  1. Open FishHealthScreen, find the FishVisionCard's internal refresh control.
  2. Tap it.
  3. `api.triggerVisionScan()` throws `TypeError`, caught silently; nothing happens, no scan triggered, no error shown.
- **Recommended fix**: Either add `triggerVisionScan` to `useApi.ts` (alias to `analyzeVision`), or change `FishVisionCard.tsx` to call `api.analyzeVision(...)`.

### E.6 [MEDIUM] `ReasoningTerminal`'s scroll-to-end `setTimeout` has no cleanup
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx` (`ReasoningTerminal` L600-722, `useEffect` L608-612)
- **Category**: Performance
- **Explanation**: `useEffect(() => { setTimeout(() => scrollRef.current?.scrollToEnd(...), 100) }, [logs])` has no cleanup. `logs` changes on every `thinkingStepIdx` tick (every 1.8s while loading) and every sensor update, so a new 100ms timeout is scheduled without cancelling the previous one. `scrollRef.current` is `null`-safe post-unmount via `?.`, so this is a leaked-timer issue, not a crash.
- **Recommended fix**: `const t = setTimeout(...); return () => clearTimeout(t);`

### E.7 [MEDIUM] `scrollBottom()` helper schedules untracked `setTimeout`s from multiple async callbacks
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx` (`scrollBottom` L1136-1137, called from `confirmAction`, `cancelAction`, `askVeronica`)
- **Category**: Performance
- **Explanation**: `setTimeout(() => scrollRef.current?.scrollToEnd(...), 80)` with no handle stored/cleared, called from async functions that can resolve after unmount. `?.` prevents a crash; this is purely a leaked-timer accumulation issue.
- **Recommended fix**: Low priority; could track timeout handles in a ref array and clear on unmount, or accept as-is given the optional-chaining guard.

### E.8 [MEDIUM] Switching chat sessions doesn't cancel a pending typewriter commit — old session's reply can leak into the new session
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx` (`startNewChat` L1055-1075, `loadSession` L1092-1134)
- **Category**: Runtime Bugs
- **Explanation**: Both functions call `setAnimatingMsg(null)` and `abortRef.current?.abort()`, but a typewriter `setTimeout` from a *previous* `askVeronica` call (same root cause as E.2) is not cancelled. If pending when the user switches sessions, it fires later and appends the **old session's reply** to the **new session's** `msgs` array.
- **Repro steps**:
  1. Send a message; while Veronica's reply is still in the typewriter animation window (up to 1.6s), immediately tap "New chat" or load a different session.
  2. `msgs` resets to the new session's history.
  3. ~1.6s later, the orphaned `setTimeout` fires, appending the old reply to the new session's message list.
- **Recommended fix**: Same fix as E.2 — store the typewriter timeout handle in a ref and `clearTimeout` it inside `startNewChat`/`loadSession` as well.

### E.9 [MEDIUM] `refreshVision` (45s) and `askVeronica`'s vision-related agent calls (90s) can race, causing `fishCount` to flicker between two scan results
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx` (`refreshVision` L1034-1053 vs `askVeronica` L1178-1285, esp. L1217-1219)
- **Category**: Frontend Issues
- **Explanation**: Both operations can run concurrently and both write `fishCount` (one directly, one via socket `fish:count`), with no shared lock — last-write-wins, so the displayed count can oscillate between two scan results with no indication of which is "current".
- **Recommended fix**: Low priority UX polish — disable "Refresh Scan" while a chat-triggered vision scan (`loading`) is in flight and vice versa, or accept last-write-wins since both originate from the same backend pipeline.

### E.10 [MEDIUM] `useSpeechRecognition.start` doesn't null out the previous recognition instance's event handlers before replacing it
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx` (`useSpeechRecognition.start` L77-117)
- **Category**: Performance
- **Explanation**: Each call to `start()` does `recRef.current?.abort()` then creates a new `SpeechRecognition` instance with fresh `.onresult`/`.onerror`/`.onend` properties, storing it in `recRef.current`. The *previous* instance's handlers (closing over the previous `askVeronica`) aren't nulled. If `abort()` doesn't synchronously suppress a queued `onend` on some platforms, the old instance's `onend` could fire after the new recognition has started, calling `setListen(false)` for the new session — a UI desync where the orb shows "idle" but STT is actually still listening.
- **Recommended fix**:
```diff
       try {
+        if (recRef.current) {
+          recRef.current.onresult = null;
+          recRef.current.onerror = null;
+          recRef.current.onend = null;
+        }
         recRef.current?.abort();
       } catch {}
```

### E.11 [LOW] `getTerminalLogs` `useMemo` keyed on `sensorData` (new identity every socket tick) defeats memoization
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx` (`ReasoningTerminal` L602-605)
- **Category**: Code Quality
- **Explanation**: `useMemo(() => getTerminalLogs(currentIndex, sensorData), [currentIndex, sensorData])` — `sensorData` gets a new object identity on every `sensor:update`, so memoization rarely prevents recomputation. Functionally harmless (cheap string concatenation).
- **Recommended fix**: Either accept it, or extract only the three numeric values (`temp_c`, `pH`, `do_mg_l`) as primitive dependencies.

### E.12 [LOW] Magic-number debounce/timeout values scattered through the voice flow
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx` (`askVeronica`, `startListening`, `toggleCall`)
- **Category**: Code Quality
- **Lines**: L1272 (250ms), L1279 (200ms), L1317-1319 (600ms), L1343 (300ms), L1184-1187 (3000ms session-bootstrap wait, 100ms poll)
- **Explanation**: Several timing constants control critical voice-loop behavior (TTS-resume debounce, retry delay, call-start delay, session-bootstrap timeout) but are inlined as magic numbers, making the echo/feedback issues (E.1) hard to tune.
- **Recommended fix**: Extract to named constants at the top of the file (`TTS_RESUME_DEBOUNCE_MS`, `STT_RETRY_DELAY_MS`, `SESSION_BOOTSTRAP_TIMEOUT_MS`).

### E.13 [LOW] `msgs.map((m, i) => <Bubble key={i} ...>)` uses array index as React key
- **File**: `apps/mobile/src/screens/FishHealthScreen.tsx` (L1672-1674)
- **Category**: Code Quality
- **Explanation**: Using array index as `key` for an appended-to (and, per E.2/E.8, potentially out-of-order) list can cause React to misattribute component identity across re-renders. `Bubble` has no internal state so impact is minor, but combined with the out-of-order-append bugs, transient flicker is possible.
- **Recommended fix**: Use a stable unique id per message (e.g., `ts.getTime()` + role composite, or a uuid).

**Notable things checked and found OK**: `useTypewriter`'s own interval correctly clears on completion/unmount. `useSpeechRecognition`'s `abort`/`stop` are called appropriately in `toggleCall`. `useSocket`'s `on` is properly memoized (matches the CLAUDE.md note that this was already fixed). The session-bootstrap race (`AsyncStorage` load vs first message) is adequately covered by `askVeronica`'s 3s poll on `sessionIdRef.current`. `agentQuery`'s `AbortController` is correctly created/aborted on new requests/session switches, with `CanceledError` handled without a stuck `loading` state.

---

## F. Mobile — Other Screens & Components

**Files reviewed**: `apps/mobile/src/screens/{DashboardScreen,ControlsScreen,AlertsScreen,HistoryScreen,SettingsScreen}.tsx` (SettingsScreen in full, ~1434 lines), `apps/mobile/src/components/{AppHeader,ErrorBoundary}.tsx`, `apps/mobile/src/components/organisms/FishVisionCard.tsx`, `apps/mobile/src/navigation/AppNavigator.tsx`, plus `useApi.ts`/`useSocket.ts`/`useSensors.ts`/`useProfile.ts`/`runtime-config.ts`, `shared/types/actuator.types.ts`.

Note: `git diff --stat` shows the near-total rewrite (1571+/622-) is in **`FishHealthScreen.tsx`** (Section E), not `SettingsScreen.tsx` — `SettingsScreen.tsx` shows no diff vs the merge base; findings below describe its current, already-settled state.

**Tally**: 1 Critical, 2 High, 3 Medium, 3 Low

### F.1 [CRITICAL] SettingsScreen persistence is a no-op on iOS/Android — all toggles silently don't save
- **File**: `apps/mobile/src/screens/SettingsScreen.tsx`
- **Function/Component**: `store` object (L52-65), used throughout `SettingsScreen`, `CollapseGroup`, `RangeRow`, `SingleRangeRow`
- **Category**: Broken Functionality
- **Lines**: L52-82, and every `store.get`/`store.set` call site (e.g. L918-934, L1011, L1078, L1143, L1170, L1193, L1211, L254, L348-349, L422)
- **Explanation**: The local `store` helper only persists via `localStorage` when `Platform.OS === 'web'`. On native (iOS/Android — the actual mobile target per CLAUDE.md/Expo SDK 54), `store.get` always returns the hardcoded default and `store.set` is a complete no-op.
- **Why it fails**: Every setting that uses `store` — TTS voice toggle, alert sound, push toggle (local mirror), agent mode, agent monitor, all four pH/temp/DO2/CO2 range min/max fields, "Advanced" and "Tank safe ranges" collapse-open state — reverts to its hardcoded default the moment the component remounts (navigating away and back, or app restart). Users who set custom safe ranges or change agent mode believe it saved (the UI updates), but on next launch everything is back to defaults.
- **Repro steps**:
  1. Run the app on iOS/Android (not web).
  2. Open Settings → Tank safe ranges → set pH min to 6.5.
  3. Navigate to Dashboard, then back to Settings.
  4. Tank safe ranges pH min field is empty/default again — the value was never persisted.
- **Recommended fix**: Replace the `store` helper with `@react-native-async-storage/async-storage` (already a dependency, used by `useProfile.ts`/`runtime-config.ts`), with an in-memory cache + async hydration on mount, mirroring `useProfile.ts`'s pattern.
- **Patch**:
```diff
+import AsyncStorage from "@react-native-async-storage/async-storage";
+
-// ── Persistent storage (web localStorage / fallback memory) ──────────────────
-const store = {
-  get: (key: string, def: string) => {
-    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
-      return localStorage.getItem(key) ?? def;
-    }
-    return def;
-  },
-  set: (key: string, val: string) => {
-    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
-      localStorage.setItem(key, val);
-    }
-  },
-};
+// ── Persistent storage (AsyncStorage on native, localStorage on web) ─────────
+const memCache = new Map<string, string>();
+const store = {
+  get: (key: string, def: string) => memCache.get(key) ?? def,
+  set: (key: string, val: string) => {
+    memCache.set(key, val);
+    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
+      localStorage.setItem(key, val);
+    } else {
+      AsyncStorage.setItem(key, val).catch(() => null);
+    }
+  },
+  hydrate: async (key: string) => {
+    try {
+      const v =
+        Platform.OS === "web" && typeof localStorage !== "undefined"
+          ? localStorage.getItem(key)
+          : await AsyncStorage.getItem(key);
+      if (v != null) memCache.set(key, v);
+      return v;
+    } catch {
+      return null;
+    }
+  },
+};
```
  Note: components reading `store.get` synchronously on first render (`RangeRow`, `CollapseGroup`, `SettingsScreen` toggles) must call `store.hydrate(key)` in a `useEffect` and update local state once resolved, since AsyncStorage is inherently async.

### F.2 [HIGH] AppHeader notification badge never decreases when alerts are acknowledged
- **File**: `apps/mobile/src/components/AppHeader.tsx`
- **Function/Component**: `AppHeader` (L24-34)
- **Category**: Frontend Issues
- **Lines**: L24-34
- **Explanation**: `alertCount` is set once on mount from `getActiveAlerts().length` and incremented on `alert:new`, but never decremented when the user acknowledges/dismisses alerts via `AlertsScreen.handleAck`/`handleClearAll` or `DashboardScreen.ackAlert`.
- **Why it fails**: On `DashboardScreen`, `AppHeader` and the alerts list are siblings in the same mounted screen — acknowledging an alert from the Dashboard's "Recent Alerts" list updates `DashboardScreen`'s own `alerts` state but doesn't notify `AppHeader`, so the bell badge keeps showing the old (higher) count until the header remounts.
- **Repro steps**:
  1. Have 3 active alerts; Dashboard shows badge "3".
  2. Tap "ACK" on one alert in Recent Alerts.
  3. Alert disappears from the list, but the header bell badge still shows "3".
- **Recommended fix**: Lift alert state to a shared hook (extend `useSocket`/a new `useAlerts` hook with a shared cache + listener set, similar to `useProfile`'s pub/sub pattern) so AppHeader, DashboardScreen, and AlertsScreen all read/write the same source of truth, or have `AppHeader` also listen for an `alert:ack`/`alert:cleared` event and decrement.

### F.3 [HIGH] ControlsScreen pump/LED toggles show success even when the backend call fails
- **File**: `apps/mobile/src/screens/ControlsScreen.tsx`
- **Function/Component**: `pumpToggle` (L386-393), `ledToggle` (L394-401)
- **Category**: Broken Functionality
- **Lines**: L386-401
- **Explanation**: `api.togglePump(...)`/`api.toggleLed(...)` errors are swallowed via `.catch(() => null)`, and `setPump(nextState)`/`setLed(nextState)` execute unconditionally afterward — the UI flips state even if the relay command never reached the backend/hardware.
- **Why it fails**: If the backend is unreachable (network drop, backend down, wrong API URL in Settings), the toggle visually changes state and gives haptic feedback, but the actual pump/LED state is unchanged, with no indication of failure.
- **Repro steps**:
  1. Stop the backend (or set an invalid API URL in Settings → Advanced).
  2. Open Controls, tap the Air Pump toggle.
  3. Toggle animates to "on" with haptic feedback, but no request succeeded and the physical pump state is unchanged.
- **Recommended fix**: Only update local state on success; on failure, show an `Alert`/toast (consistent with `addFeed`/`patchFeed` error handling elsewhere in the file) and leave the switch in its prior state, or revert to `actuator:state` socket truth.
- **Patch**:
```diff
   const pumpToggle = async () => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
     const nextState = !pump;
     setPumpL(true);
-    await api.togglePump({ state: nextState }).catch(() => null);
-    setPump(nextState);
-    setPumpL(false);
+    try {
+      await api.togglePump({ state: nextState });
+      setPump(nextState);
+    } catch (e: any) {
+      Alert.alert('Pump command failed', e?.message ?? 'Device unreachable');
+    } finally {
+      setPumpL(false);
+    }
   };
   const ledToggle = async () => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
     const nextState = !led;
     setLedL(true);
-    await api.toggleLed({ state: nextState }).catch(() => null);
-    setLed(nextState);
-    setLedL(false);
+    try {
+      await api.toggleLed({ state: nextState });
+      setLed(nextState);
+    } catch (e: any) {
+      Alert.alert('LED command failed', e?.message ?? 'Device unreachable');
+    } finally {
+      setLedL(false);
+    }
   };
```

### F.4 [MEDIUM] AlertsScreen "Clear All" assumes success and clears the UI even if every acknowledge call fails
- **File**: `apps/mobile/src/screens/AlertsScreen.tsx` (`handleClearAll` L57-61, `handleAck` L51-55)
- **Category**: Broken Functionality
- **Explanation**: `api.acknowledgeAlert(a.alertId).catch(() => null)` is fired for every alert without awaiting/checking results, then `setAlerts([])` runs immediately regardless of whether the backend actually acknowledged anything. With the backend down, "Clear All" empties the list client-side but alerts remain "active" server-side, so they reappear on next load.
- **Recommended fix**: Use `Promise.allSettled`, only remove alerts whose acknowledge call succeeded, and surface a toast/Alert for failures (mirroring `ControlsScreen.patchFeed`'s `reloadMgmt()` rollback pattern).

### F.5 [MEDIUM] `FishVisionCard` polls `/vision/latest` every 30s with a leftover dev "internal monologue" comment
- **File**: `apps/mobile/src/components/organisms/FishVisionCard.tsx` (`FishVisionCard` L18-33)
- **Category**: Performance / Code Quality
- **Explanation**: `fetchVision` is `useCallback`'d with `[]` deps but closes over `api` from `useApi()` (a non-memoized, brand-new object every render). A leftover comment on L27 ("api is not stable in dependency array... Actually, we should omit api...") is dev internal-monologue left in shipped code. The `setInterval`/`clearInterval` cleanup itself is correct.
- **Recommended fix**: Remove the comment — `api` methods are stable closures over a singleton axios instance, so `[]` deps are fine as-is.

### F.6 [MEDIUM] `ManagementCard`'s `persistKey` prop is declared but completely unused
- **File**: `apps/mobile/src/screens/ControlsScreen.tsx` (`ManagementCard` L155-201, prop at L155-161)
- **Category**: Code Quality
- **Explanation**: `persistKey?: string` is part of the component's prop type but never read in the function body — `open` always initializes to `!!defaultOpen` and isn't persisted, despite the name implying it would (mirrors `CollapseGroup.persistKey` in SettingsScreen, which *is* used).
- **Recommended fix**: Remove the unused `persistKey` prop, or implement persistence consistent with `CollapseGroup` if expand-state retention is desired.

### F.7 [LOW] `SettingsScreen`'s `SETTINGS_KEYS` constants are read by nothing else in the app
- **File**: `apps/mobile/src/screens/SettingsScreen.tsx` (`SETTINGS_KEYS` L67-82)
- **Category**: Code Quality
- **Explanation**: Grep across `apps/mobile/src` shows no other file reads any of the `fishlinic_*` storage keys. Combined with F.1, these settings are effectively decorative — they don't drive behavior anywhere else (agent mode/monitor toggles do PATCH the backend, but the local mirror other screens might read doesn't exist).
- **Recommended fix**: Once F.1 is fixed, audit which keys should actually be consumed elsewhere (e.g. agent mode/monitor for `FishHealthScreen`'s Veronica chat, range values for client-side status badges in `DashboardScreen`/`HistoryScreen`).

### F.8 [LOW] Inconsistent settings sync — some toggles PATCH the backend, others (TTS, alert sound) only write the broken local store
- **File**: `apps/mobile/src/screens/SettingsScreen.tsx` (Notifications section L1159-1218)
- **Category**: Code Quality / Broken Functionality
- **Explanation**: "Push notifications" and the AI Agent toggles PATCH `/management/tank-config`. "Alert sound" and "Veronica voice" (TTS) only call `store.set` — possibly intentional as local-only UX prefs, but combined with F.1's no-op `store`, these two toggles currently have **zero effect anywhere** on native.
- **Recommended fix**: Confirm intended scope (local-only is fine for TTS/alert-sound), but fix the underlying `store` (F.1) so local-only settings at least persist across restarts.

### F.9 [LOW] `ErrorBoundary.reset()` doesn't clear potentially-corrupted app state — can loop on a persistent crash
- **File**: `apps/mobile/src/components/ErrorBoundary.tsx` (`ErrorBoundary` L9-36, `reset()` logic L12-20)
- **Category**: Code Quality
- **Explanation**: `getDerivedStateFromError`/`componentDidCatch` are correctly implemented and `App.tsx` wraps the navigator in `<ErrorBoundary>` with a working "Try again" button — confirmed correct, no bug. However, `reset()` only flips `hasError` back to `false`; if the crash is caused by persistent bad state (e.g. a corrupted value in the `useProfile` cache), "Try again" immediately re-throws the same error in a loop with no escape.
- **Recommended fix**: Add a secondary action (e.g. "Reset app data") that clears `AsyncStorage` caches (`fishlinic_profile`, `fishlinic_api_url`) for cases where `reset()` alone can't recover.

---

## G. Cross-Cutting Contracts & Shared Hooks/Infra

**Files reviewed**: all 7 `shared/types/*.ts` files, `apps/mobile/src/hooks/{useApi,useSocket,useSensors,useProfile,usePushToken}.ts`, `apps/mobile/src/lib/runtime-config.ts`, all 12 `services/backend/src/modules/*/*.controller.ts` (route signatures), `docs/api-contracts.md`.

**Tally**: 0 Critical, 1 High, 4 Medium, 5 Low (+1 positive confirmation)

### G.1 [HIGH] `AlertSeverity` `'EMERGENCY'` missing from `useSocket`'s local `AlertPayload`, plus full local-type drift from `shared/types`
- **File**: `apps/mobile/src/hooks/useSocket.ts`
- **Function/Component**: `AlertPayload`, `SensorReading`, `FishCountPayload`, `HealthReport` (L6-38)
- **Category**: Runtime Bugs
- **Lines**: L18-24 (AlertPayload), L6-16 (SensorReading), L26-29 (FishCountPayload), L31-38 (HealthReport)
- **Explanation**: `useSocket.ts` does not import any types from `@fishlinic/types` (confirmed via grep — no matches) and instead redeclares four payload types locally, each drifted from its canonical counterpart:
  - `AlertPayload.severity: 'INFO' | 'WARNING' | 'CRITICAL'` (3 values) vs canonical `AlertSeverity` (4 values, includes `'EMERGENCY'`, `shared/types/alert.types.ts` L1).
  - `SensorReading` (local, all-optional, with ad-hoc `pH?`/`temp_c?`/`do_mg_l?` fields) vs canonical `SensorReading` (`shared/types/sensor.types.ts`, all required, no flat fields).
  - `FishCountPayload` (`{count, timestamp}`) vs canonical `FishCount` (`{count, timestamp, snapshotId}`) — missing `snapshotId`, which the backend's `emitFishCount` actually sends.
  - `HealthReport` (missing `reportId`, `visualStatus`, `behaviorStatus`; has extra `overallScore?`/`timestamp?` not in canonical `FishHealthReport`).
- **Why it fails**: Backend emits `Alert` objects (with `AlertSeverity` including `'EMERGENCY'`, cross-ref D.1) via `gateway.gateway.ts`'s `emitAlertNew(alert: Alert)` → `this.server.emit('alert:new', alert)`. On mobile, `useSocket.ts` types the handler as `(data: AlertPayload) => void` — a real `'EMERGENCY'` alert is typed as `AlertPayload['severity']`, which doesn't include `'EMERGENCY'`. Any new code written against `AlertPayload.severity` (e.g., a `switch` with cases for INFO/WARNING/CRITICAL and a `default`) would route an EMERGENCY alert into the unhandled `default` branch with no TS warning of a missing case. (Note: `AlertsScreen.tsx` does NOT consume `latestAlert` from `useSocket()` — it has its own local `Alert` type that DOES include `EMERGENCY`, so this isn't visibly broken *today*, but `latestAlert`/`AlertPayload` is exported for any other screen to use, and its type signature mis-documents the real payload shape.)
- **Repro steps**:
  1. Apply D.1's fix so the backend emits `severity: 'EMERGENCY'`.
  2. `gateway.gateway.ts`'s `emitAlertNew(alert)` broadcasts `alert:new` with `severity: 'EMERGENCY'`.
  3. Any mobile component using `useSocket().latestAlert` with `if (severity === 'WARNING') {...} else if (severity === 'CRITICAL') {...} else {...}` (TS believes severity is exhaustively the 3-value union) routes the EMERGENCY alert into the `else`/INFO branch without a compile-time warning.
- **Recommended fix**: Delete the four locally-redeclared types in `useSocket.ts` and import `SensorReading`, `Alert` (as `AlertPayload`), `FishCount` (as `FishCountPayload`), `FishHealthReport` (as `HealthReport`) from `@fishlinic/types`, matching the pattern already used in the backend gateway.
- **Patch**:
```diff
--- a/apps/mobile/src/hooks/useSocket.ts
+++ b/apps/mobile/src/hooks/useSocket.ts
@@
 import { useCallback, useEffect, useState } from 'react';
 import { io, Socket } from 'socket.io-client';
 import { getApiBase, subscribeApiBase } from '../lib/runtime-config';
 import { replacePort } from './useApi';
+import type {
+  SensorReading,
+  Alert as AlertPayload,
+  FishCount as FishCountPayload,
+  FishHealthReport as HealthReport,
+} from '@fishlinic/types';
 
-export type SensorReading = {
-  sensorId?: number;
-  type?: string;
-  value?: number;
-  unit?: string;
-  status?: 'ok' | 'warn' | 'critical';
-  timestamp: string;
-  pH?: number;
-  temp_c?: number;
-  do_mg_l?: number;
-};
-
-export type AlertPayload = {
-  id?: number;
-  alertId?: number;
-  message: string;
-  severity: 'INFO' | 'WARNING' | 'CRITICAL';
-  createdAt: string;
-};
-
-export type FishCountPayload = {
-  count: number;
-  timestamp: string;
-};
-
-export type HealthReport = {
-  phStatus: 'ok' | 'warn' | 'critical';
-  tempStatus: 'ok' | 'warn' | 'critical';
-  doStatus: 'ok' | 'warn' | 'critical';
-  overallScore?: number;
-  createdAt?: string;
-  timestamp?: string;
-};
+export type { SensorReading, AlertPayload, FishCountPayload, HealthReport };
```
  Note: if `useSensors.ts`'s flat `pH`/`temp_c`/`do_mg_l` fields are still emitted by some backend code path, add them to the canonical `SensorReading` in `shared/types/sensor.types.ts` instead of keeping a local fork — verify against `sensors.service.ts`/serial-bridge payloads before deleting.

### G.2 [MEDIUM] `system:notification` socket event emitted by backend but undeclared in `ServerToClientEvents` and unconsumed by mobile
- **File**: `services/backend/src/modules/gateway/gateway.service.ts` (`broadcastSystemNotification` L13-20), `shared/types/socket.types.ts` (`ServerToClientEvents` L6-12), `apps/mobile/src/hooks/useSocket.ts` (bind/unbind L82-99)
- **Category**: Code Quality / Frontend Issues
- **Explanation**: `GatewayService.broadcastSystemNotification(message, type)` emits `'system:notification'` with `{ message, type, timestamp }`, but `ServerToClientEvents` only declares `sensor:update`, `alert:new`, `fish:count`, `actuator:state`, `health:report`. `useSocket.ts`'s `bind`/`unbind` register handlers for exactly those five events. Grep confirms `system:notification` has zero call sites for `broadcastSystemNotification` anywhere in `services/backend/src` (cross-ref A.14) — so the drift is currently latent, but if this method is ever called, the event is silently dropped on the client.
- **Recommended fix**: Either (a) add `'system:notification': (data: { message: string; type: 'info'|'warning'|'alert'; timestamp: string }) => void` to `ServerToClientEvents` and add a corresponding handler in `useSocket.ts` exposing a `systemNotification` state (similar to `latestAlert`); or (b) if `broadcastSystemNotification` is dead code, remove it from `gateway.service.ts` to eliminate the drift. (a) is recommended since the method appears intentionally designed for ops broadcasts.

### G.3 [MEDIUM] Hardcoded `EXPO_PUBLIC_API_URL=http://localhost:3000` in `.env`/`.env.example` short-circuits LAN host-detection in production builds
- **File**: `apps/mobile/src/lib/runtime-config.ts` (`resolveDefaultApiBase` L9-23), `apps/mobile/.env`, `apps/mobile/.env.example`
- **Category**: Frontend Issues / Backend Issues (deployment)
- **Lines**: runtime-config.ts L10; apps/mobile/.env L2; apps/mobile/.env.example L2
- **Explanation**: `resolveDefaultApiBase()` checks `process.env.EXPO_PUBLIC_API_URL` first (L10) and returns immediately if set, before falling back to `hostUri`-based LAN-IP detection (L12-20) or `http://localhost:3000` (L22). Both `.env` and `.env.example` hardcode `EXPO_PUBLIC_API_URL=http://localhost:3000`. Expo inlines `EXPO_PUBLIC_*` vars into the JS bundle at build time — if `.env` is present during `eas build`/`expo export` for a production binary, `getDefaultApiBase()` permanently returns `http://localhost:3000` for every installed device. On a physical phone, `localhost` resolves to the phone itself, not the backend server.
- **Why it fails**: `apiBaseCache` is initialized once at module load from `resolveDefaultApiBase()`. The only escape hatch (`hydrateRuntimeConfig()`, reading a user override from `AsyncStorage`) requires the user to have manually configured a custom API URL in-app. A fresh install has no such override and is permanently stuck on `localhost:3000`.
- **Repro steps**:
  1. `eas build`/`expo export` for production with `apps/mobile/.env` present containing `EXPO_PUBLIC_API_URL=http://localhost:3000`.
  2. Install on a physical device with the backend on a separate LAN host.
  3. App loads — `getDefaultApiBase()`/`getApiBase()` return `http://localhost:3000` (baked into the bundle).
  4. All `useApi()` calls and the `useSocket.ts` `resolveSocketUrl()` (which also reads `EXPO_PUBLIC_WS_URL` first) hit `localhost:3000` on the device itself → connection refused, no data, sockets never connect.
- **Recommended fix**: Don't commit a hardcoded `EXPO_PUBLIC_API_URL` for production-style builds — remove it from `.env` so dev builds fall through to `hostUri`-based LAN detection (correct for Expo Go/dev client), and set `EXPO_PUBLIC_API_URL` only via EAS build-profile env vars (`eas.json`) for release builds pointing at the real production host. At minimum, document in `.env.example` that this MUST be overridden for any non-localhost deployment.

### G.4 [MEDIUM] `useProfile.ts`: optimistic cache update isn't rolled back if `AsyncStorage.setItem` fails
- **File**: `apps/mobile/src/hooks/useProfile.ts` (module-level `cache`/`listeners` L30-31, `save()` L41-45, `useProfile` L49-62)
- **Category**: Code Quality
- **Explanation**: The module-level pub/sub (`cache`, `listeners`) is otherwise sound — cleanup via `listeners.delete(fn)` in the `useEffect` return is correctly wired, no leak. However, `save()` mutates `cache` and notifies all listeners *before* `AsyncStorage.setItem` resolves; if `setItem` throws (storage full, Android permission issue), the error is swallowed (empty `catch`), but `cache` and all subscribed components already show the new value for the rest of the session.
- **Why it fails**: On next app launch, `load()` reads the OLD persisted value from disk, silently reverting the user's change with no error/toast — an "optimistic update without rollback on persistence failure".
- **Recommended fix**: In `save()`, on `AsyncStorage.setItem` failure, either revert `cache` to its pre-update value and re-notify listeners, or surface an error/toast. Low priority given `catch {}` is a repo-wide pattern, but worth a shared "best-effort persist with rollback" helper if profile data (e.g. `cloudSync`/`tier`) grows in importance.

### G.5 [MEDIUM] `useSensors.ts` defines a third, differently-shaped `SensorReading` type — naming collision with `shared/types` and `useSocket.ts`
- **File**: `apps/mobile/src/hooks/useSensors.ts` (`SensorReading` L5-9, `SensorMap` L11)
- **Category**: Code Quality
- **Explanation**: `useSensors.ts` defines its own `SensorReading` (`{ value, unit, status }`, no `sensorId`/`type`/`timestamp`) — a THIRD distinct shape named `SensorReading` alongside `shared/types/sensor.types.ts`'s full reading and `useSocket.ts`'s local all-optional/flat-field version (G.1). This one is really a per-`SensorType` *value cell* (`SensorMap = Record<string, SensorReading>`), so the name collision increases the chance a future refactor imports the wrong one — especially once G.1 makes `useSocket.ts` import the canonical `SensorReading` from `@fishlinic/types`, leaving `useSensors.ts`'s same-named-but-different type even more confusing by contrast.
- **Recommended fix**: Rename `useSensors.ts`'s local type to something distinct (e.g. `SensorCell`/`SensorValue`). Functionally fine as-is — purely a naming/discoverability hazard.

### G.6 [LOW] `ApiResponse<T>` (`shared/types/api.types.ts`) is dead code — zero usages
- **File**: `shared/types/api.types.ts` (`ApiResponse<T>` L2-6)
- **Category**: Code Quality
- **Explanation**: `grep -rn "ApiResponse" services/backend/src` returns zero matches. All 12 backend controllers return raw entities/plain objects/arrays directly (e.g. `AlertsController.acknowledge()` returns `{status: 'acknowledged'}`). The file's own comment ("Placeholder for API Request/Response shapes") confirms this is an unrealized plan.
- **Recommended fix**: Remove `ApiResponse<T>` from `shared/types/api.types.ts` and its `index.ts` re-export, or wire it into a global NestJS response interceptor if it's intended as a future standard.

### G.7 [LOW] `docs/api-contracts.md` documents `POST /actuators/state` but the actual route is `GET /actuators/state`
- **File**: `docs/api-contracts.md` (L17), `services/backend/src/modules/actuators/actuators.controller.ts` (`getState` L46-49)
- **Category**: Code Quality (doc drift)
- **Explanation**: The doc says `POST /actuators/state -> (Internal) Used by serial bridge to confirm relay state.`, but the controller declares `@Get('state')` and `useApi.ts` calls it as `api.get("/actuators/state")` — both code paths agree it's a GET.
- **Recommended fix**: Update `docs/api-contracts.md` L17 to `GET /actuators/state -> Returns current actuator relay states.`

### G.8 [LOW] `docs/api-contracts.md` is missing documentation for several existing endpoints
- **File**: `docs/api-contracts.md` (REST Endpoints section, L5-34)
- **Category**: Code Quality (doc drift)
- **Explanation**: Cross-referencing all 12 controllers against the doc — undocumented but present in code: `POST /actuators/emergency-off`; `GET /fish/diagnoses`, `POST /fish/diagnosis`, `POST /fish/anomaly` (Maral integration endpoints); `GET /vision/latest`, `GET /vision/latest-report`; nearly all of `/voice/*` (`/voice/status`, `/voice/agent`, `/voice/agent/confirm`, `/voice/sessions/*`, `/voice/chat-sessions`); the entire `/management/*` module; `GET /sensors/history?range=`.
- **Recommended fix**: The doc appears to predate the voice/agent, management, and vision-report features. Recommend a pass adding sections for Management, Voice/Agent, Vision, and Fish-diagnostics endpoints, or mark the doc as historical/non-authoritative.

### G.9 [LOW] `useApi.ts`'s `voiceQuery` (`POST /voice/query`) is unused dead client code
- **File**: `apps/mobile/src/hooks/useApi.ts` (`voiceQuery` L41-42)
- **Category**: Code Quality
- **Explanation**: `grep -n "voiceQuery" -r apps/mobile/src` returns only the definition. The backend route `POST /voice/query` still exists and is documented, so this isn't a broken-endpoint issue — mobile has moved to `agentQuery`/`/voice/agent` for `FishHealthScreen`'s chat.
- **Recommended fix**: Remove `voiceQuery` from `useApi.ts` if confirmed unused, or note it as a legacy fallback if intentionally retained.

### G.10 [LOW] `usePushToken.ts` PATCHes `/management/tank-config` with `pushToken` — verify `TankConfigEntity` actually has this column
- **File**: `apps/mobile/src/hooks/usePushToken.ts` (`registerToken` L13-34), `services/backend/src/modules/management/management.controller.ts` (`updateConfig` L37-38)
- **Category**: Backend Issues / Code Quality
- **Explanation**: `usePushToken.ts` does a raw `fetch` (not via `useApi()`) to `PATCH /management/tank-config` with `{ pushToken: token }`. The controller's `updateConfig(@Body() dto: Partial<TankConfigEntity>)` passes `dto` straight through — this only works if `TankConfigEntity` actually declares a `pushToken` column. `tank-config.entity.ts` wasn't read in this pass, so this is a verification item, not a confirmed bug: if the column is missing, TypeORM could silently drop the field on `update`/`save`, meaning push registration would silently no-op.
- **Recommended fix**: `grep -n pushToken services/backend/src/modules/database/entities/tank-config.entity.ts` to confirm the column exists (cross-ref D.1, which assumes it does).

### G.11 [Positive confirmation] All ~30 `useApi.ts` endpoints have matching backend routes — no broken-endpoint findings
- **File**: `apps/mobile/src/hooks/useApi.ts` vs all `services/backend/src/modules/*/*.controller.ts`
- **Category**: Code Quality
- **Explanation**: Every endpoint called in `useApi.ts` (sensors, alerts, actuators, fish, vision, voice, management) was matched against an existing controller route — no 404/Critical/High broken-endpoint findings from this cross-check.

---

## Prioritized Action Plan

### Phase 1 — This Sprint (Critical & High, 21 findings)

**Critical (6) — fix first, in this order:**
1. **A.1** — Fix `services/backend/tsconfig.json` invalid JSON (`ç{` → `{`). Blocks every other change from being build-verified — do this before touching anything else.
2. **A.2** — Remove the startup CO2-history-deleting seed task (data loss on every boot).
3. **D.1** — Wire up `EMERGENCY` alert severity production + push notification dispatch (dead safety-critical path).
4. **C.1** — Add auth/guard to `POST /voice/agent/confirm` (unauthenticated actuator trigger).
5. **F.1** — Replace `SettingsScreen`'s no-op `store` with `AsyncStorage` (all native settings silently don't persist).
6. **E.1** — Add a hard turn-limit/signal-based guard to the STT/TTS loop in `FishHealthScreen.tsx` (feedback-loop risk).

**High (15):**
7. **A.3** — Add migration for `HealthReport` entity columns missing from the only existing migration.
8. **A.4** — Disable TypeORM `synchronize: true` outside of SQLite/dev.
9. **A.5** — Fix `POST /actuators/feed` dropping the `duration` field.
10. **B.1** — Fix/remove dangling `/vision/snapshots/:id/image` route (add path-traversal guard if kept).
11. **C.2** — Add HTTP timeouts to LLM/actuator calls in the voice/agent module.
12. **D.2** — Fix `daysMask` schedule evaluation to use a consistent (non-server-local) timezone.
13. **D.3** — Remove or fix the dead/overlapping `checkEmergencyConditions` cron no-op.
14. **D.4** — Add dedup/idempotency between sensor-threshold alerts and the scheduler's emergency check.
15. **E.2** — Fix `useTypewriter` stale-reply reordering via a `typewriterTimeoutRef`.
16. **E.3** — Add `AbortController` to `refreshVision`.
17. **E.4** — Fix `askVeronica` stale-closure bug (sensors/fishCount/ttsEnabled) via refs.
18. **E.5** — Fix `FishVisionCard`'s call to the non-existent `api.triggerVisionScan`.
19. **F.2** — Fix `AppHeader` notification badge never decreasing on alert acknowledgement.
20. **F.3** — Fix `ControlsScreen` pump/LED toggles reporting false success on backend failure.
21. **G.1** — Replace `useSocket.ts`'s locally-redeclared payload types with imports from `@fishlinic/types` (fixes `EMERGENCY` severity drift, depends on D.1).

### Phase 2 — Next Sprint (Medium, 26 findings)

- **A.6** — Remove dead code in `database.config.ts`.
- **A.7** — Add auth (or remove) `legacy.controller.ts`'s unauthenticated `/feed`/`/schedule` routes; fix the no-op `/schedule` endpoint.
- **A.8** — Add error handling to `SerialController`.
- **A.9** — Make sensor-history sort order consistent.
- **B.2** — Resolve `confidence` field proxy mismatch between vision service and shared types.
- **B.3** — Remove dead disease-label mapping code.
- **B.4** — Address latent path-traversal risk in vision snapshot handling.
- **B.5** — Reconcile `FishCount`/`HealthReport` entity fields with `shared/types` definitions.
- **C.3** — Fix `triggerFeed` ignoring feed cycles.
- **C.4** — Fix actuator state always reporting OFF in `/voice/query`.
- **D.5** — Persist `lastLedState` so it survives a backend restart.
- **D.6** — Reconcile the 55s/60s debounce/tick margins and overlapping `setInterval`s in the scheduler.
- **D.7** — Fix `PushService` single-token model / pushToken-hijack-via-PATCH risk.
- **D.8** — Fix `getLightSchedule`/`getTankConfig`'s lying `row!` non-null assertions.
- **E.6** — Add cleanup for `ReasoningTerminal`'s `setTimeout`.
- **E.7** — Track/cleanup the untracked `scrollBottom` `setTimeout`.
- **E.8** — Cancel pending typewriter commits on session switch.
- **E.9** — Fix `refreshVision`/`askVeronica` `fishCount` race condition.
- **E.10** — Fix `useSpeechRecognition.start` not nulling old handlers.
- **F.4** — Fix `AlertsScreen` "Clear All" assuming success regardless of backend result.
- **F.5** — Remove leftover dev comment in `FishVisionCard`.
- **F.6** — Remove or wire up `ManagementCard`'s unused `persistKey` prop.
- **G.2** — Either declare `system:notification` in `ServerToClientEvents` + handle in `useSocket.ts`, or remove `broadcastSystemNotification` if unused.
- **G.3** — Remove hardcoded `EXPO_PUBLIC_API_URL=http://localhost:3000` from `apps/mobile/.env` for production builds; document override requirement.
- **G.4** — Add rollback-on-failure to `useProfile.ts`'s optimistic `save()`.
- **G.5** — Rename `useSensors.ts`'s local `SensorReading` to avoid a 3-way name collision.

### Phase 3 — Backlog (Low, 24 findings)

- **A.10** — Delete 64 stale compiled `.js` files from `services/backend/src`, add to `.gitignore`.
- **A.11** — Stop tracking `services/backend/fishlinic.sqlite` as a binary in git.
- **A.12** — Fix `.env.example`'s Supabase hostname placeholder.
- **A.13** — Make `togglePump`/`toggleLed` defaults explicit rather than default-true.
- **A.14** — Resolve `GatewayGateway`/`ActuatorsService` circular dependency.
- **B.6** — No action — `find`/`findOne` refactor confirmed non-issue.
- **B.7** — Add `imagePath` validation to `requestSnapshot`.
- **B.8** — Add types for AI predictor HTTP responses.
- **C.5** — Deduplicate provider-selection logic across voice/agent files.
- **C.6** — Persist the user's turn in the `/voice/agent/confirm` flow.
- **D.9** — Remove the empty/dead `CronController`.
- **D.10** — Replace the hardcoded `*2.1` constant in `fishGrowthMonitor` with a named/configurable value.
- **D.11** — Add a cleanup endpoint to `AlertsController`.
- **E.11** — Fix `getTerminalLogs` `useMemo` being defeated.
- **E.12** — Extract magic-number timing constants in `FishHealthScreen.tsx`.
- **E.13** — Replace array-index React keys in `FishHealthScreen.tsx`.
- **F.7** — Remove or wire up unread `SETTINGS_KEYS` constants.
- **F.8** — Reconcile inconsistent settings sync (TTS/alert-sound local-only vs PATCH-backed toggles).
- **F.9** — Add an app-data-reset action to `ErrorBoundary.reset()`.
- **G.6** — Remove unused `ApiResponse<T>` type (or wire into a response interceptor).
- **G.7** — Fix `docs/api-contracts.md`'s `POST /actuators/state` → `GET /actuators/state`.
- **G.8** — Document the missing endpoints in `docs/api-contracts.md` (emergency-off, fish diagnostics, vision latest/report, voice/agent, management, sensors history).
- **G.9** — Remove dead `voiceQuery` from `useApi.ts`.
- **G.10** — Verify `TankConfigEntity` has a `pushToken` column (used by `usePushToken.ts`).

---

## Appendix: Files Reviewed Per Area

**A — Backend Core (Sensors/Actuators/Serial/Gateway/Database/Bootstrap)**
`services/backend/src/modules/{sensors,actuators,serial,gateway,database}/**/*.ts`, `services/backend/src/{main.ts,app.module.ts,app.service.ts,app.controller.ts}`, `services/backend/tsconfig.json`, `services/backend/.env.example`.

**B — Fish & Vision Modules**
`services/backend/src/modules/fish/**/*.ts`, `services/backend/src/modules/vision/**/*.ts`.

**C — Voice/Agent Subsystem ("Veronica")**
`services/backend/src/modules/voice/**/*.ts` (`agent.service.ts`, `agent.tools.ts`, `agent.types.ts`, `agent.monitor.ts`, `voice.service.ts`, `voice.controller.ts`, `voice.module.ts`).

**D — Management/Alerts/Cron/Push**
`services/backend/src/modules/{management,alerts,cron,push}/**/*.ts`.

**E — Mobile FishHealthScreen.tsx**
`apps/mobile/src/screens/FishHealthScreen.tsx` (full, 2391 lines).

**F — Mobile Other Screens & Components**
`apps/mobile/src/screens/{DashboardScreen,ControlsScreen,AlertsScreen,HistoryScreen,SettingsScreen}.tsx`, `apps/mobile/src/components/**/*.tsx`, `apps/mobile/src/navigation/AppNavigator.tsx`.

**G — Cross-Cutting Contracts & Shared Hooks/Infra**
`shared/types/*.ts` (all 7 files), `apps/mobile/src/hooks/{useApi,useSocket,useSensors,useProfile,usePushToken}.ts`, `apps/mobile/src/lib/runtime-config.ts`, all `services/backend/src/modules/*/*.controller.ts` (route signatures), `docs/api-contracts.md`.

