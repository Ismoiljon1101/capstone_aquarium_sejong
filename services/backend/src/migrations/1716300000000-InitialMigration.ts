import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1716300000000 implements MigrationInterface {
  name = 'InitialMigration1716300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create camera_snapshots first because fish_counts references it
    await queryRunner.query(`
      CREATE TABLE "camera_snapshots" (
        "snapshotId" SERIAL PRIMARY KEY,
        "imagePath" varchar NOT NULL,
        "triggeredBy" varchar NOT NULL,
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // 2. Create sensor_readings
    await queryRunner.query(`
      CREATE TABLE "sensor_readings" (
        "readingId" SERIAL PRIMARY KEY,
        "sensorId" integer NOT NULL,
        "type" varchar NOT NULL,
        "value" double precision NOT NULL,
        "unit" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'ok',
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sensor_readings_sensorId" ON "sensor_readings" ("sensorId")`);
    await queryRunner.query(`CREATE INDEX "IDX_sensor_readings_type" ON "sensor_readings" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_sensor_readings_timestamp" ON "sensor_readings" ("timestamp")`);

    // 3. Create alerts
    await queryRunner.query(`
      CREATE TABLE "alerts" (
        "alertId" SERIAL PRIMARY KEY,
        "sensorId" integer NOT NULL,
        "tankId" integer NOT NULL,
        "type" varchar NOT NULL,
        "severity" varchar NOT NULL,
        "message" text NOT NULL,
        "acknowledged" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // 4. Create fish_counts
    await queryRunner.query(`
      CREATE TABLE "fish_counts" (
        "countId" SERIAL PRIMARY KEY,
        "snapshotId" integer NOT NULL,
        "count" integer NOT NULL,
        "confidence" double precision NOT NULL,
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_fish_counts_snapshot" FOREIGN KEY ("snapshotId") REFERENCES "camera_snapshots" ("snapshotId") ON DELETE CASCADE
      )
    `);

    // 5. Create health_reports
    await queryRunner.query(`
      CREATE TABLE "health_reports" (
        "reportId" SERIAL PRIMARY KEY,
        "snapshotId" integer,
        "phStatus" varchar NOT NULL DEFAULT 'ok',
        "tempStatus" varchar NOT NULL DEFAULT 'ok',
        "doStatus" varchar NOT NULL DEFAULT 'ok',
        "visualStatus" varchar NOT NULL DEFAULT 'ok',
        "behaviorStatus" varchar NOT NULL DEFAULT 'ok',
        "overallScore" double precision NOT NULL DEFAULT 1.0,
        "summary" text NOT NULL DEFAULT '',
        "diseaseClass" varchar,
        "mlConfidence" double precision,
        "severity" varchar,
        "fishId" integer,
        "source" varchar NOT NULL DEFAULT 'manual',
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // 6. Create feed_schedules
    await queryRunner.query(`
      CREATE TABLE "feed_schedules" (
        "id" SERIAL PRIMARY KEY,
        "time" varchar NOT NULL,
        "daysMask" integer NOT NULL DEFAULT 127,
        "portionSec" integer NOT NULL DEFAULT 3,
        "enabled" boolean NOT NULL DEFAULT true,
        "lastFiredAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // 7. Create light_schedules
    await queryRunner.query(`
      CREATE TABLE "light_schedules" (
        "id" SERIAL PRIMARY KEY,
        "onTime" varchar NOT NULL DEFAULT '07:00',
        "offTime" varchar NOT NULL DEFAULT '21:00',
        "brightness" integer NOT NULL DEFAULT 80,
        "color" varchar NOT NULL DEFAULT '#ffffff',
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // 8. Create tank_config
    await queryRunner.query(`
      CREATE TABLE "tank_config" (
        "id" integer PRIMARY KEY DEFAULT 1,
        "cleaningIntervalDays" integer NOT NULL DEFAULT 14,
        "lastCleanedAt" TIMESTAMPTZ,
        "emergencyTempMax" double precision NOT NULL DEFAULT 30.0,
        "emergencyTempMin" double precision NOT NULL DEFAULT 20.0,
        "emergencyDoMin" double precision NOT NULL DEFAULT 4.0,
        "emergencyPhMin" double precision NOT NULL DEFAULT 6.0,
        "emergencyPhMax" double precision NOT NULL DEFAULT 8.5,
        "pushToken" varchar,
        "pushEnabled" boolean NOT NULL DEFAULT true,
        "agentMode" varchar NOT NULL DEFAULT 'confirm',
        "agentMonitorEnabled" boolean NOT NULL DEFAULT true,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // 9. Create actuator_events
    await queryRunner.query(`
      CREATE TABLE "actuator_events" (
        "id" SERIAL PRIMARY KEY,
        "type" varchar NOT NULL,
        "state" boolean NOT NULL,
        "source" varchar NOT NULL,
        "reason" varchar,
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // 10. Create chat_messages
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" SERIAL PRIMARY KEY,
        "sessionId" varchar NOT NULL,
        "role" varchar NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_chat_messages_sessionId_createdAt" ON "chat_messages" ("sessionId", "createdAt")`);

    // 11. Create user_commands
    await queryRunner.query(`
      CREATE TABLE "user_commands" (
        "commandId" SERIAL PRIMARY KEY,
        "actuatorId" integer NOT NULL,
        "commandType" varchar NOT NULL,
        "source" varchar NOT NULL,
        "payload" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "executedAt" TIMESTAMPTZ
      )
    `);

    // 12. Create fish_growth
    await queryRunner.query(`
      CREATE TABLE "fish_growth" (
        "growthId" SERIAL PRIMARY KEY,
        "date" varchar NOT NULL,
        "avgSizeEstimate" double precision NOT NULL,
        "count" integer NOT NULL,
        "deltaFromPrev" double precision NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // 13. Create voice_sessions
    await queryRunner.query(`
      CREATE TABLE "voice_sessions" (
        "sessionId" SERIAL PRIMARY KEY,
        "snapshotId" integer,
        "wakeWordAt" TIMESTAMPTZ NOT NULL,
        "transcribedText" text NOT NULL,
        "aiResponse" text NOT NULL,
        "audioOutputPath" varchar,
        "durationMs" integer NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "voice_sessions"`);
    await queryRunner.query(`DROP TABLE "fish_growth"`);
    await queryRunner.query(`DROP TABLE "user_commands"`);
    await queryRunner.query(`DROP INDEX "IDX_chat_messages_sessionId_createdAt"`);
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(`DROP TABLE "actuator_events"`);
    await queryRunner.query(`DROP TABLE "tank_config"`);
    await queryRunner.query(`DROP TABLE "light_schedules"`);
    await queryRunner.query(`DROP TABLE "feed_schedules"`);
    await queryRunner.query(`DROP TABLE "health_reports"`);
    await queryRunner.query(`DROP TABLE "fish_counts"`);
    await queryRunner.query(`DROP TABLE "alerts"`);
    await queryRunner.query(`DROP INDEX "IDX_sensor_readings_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_sensor_readings_type"`);
    await queryRunner.query(`DROP INDEX "IDX_sensor_readings_sensorId"`);
    await queryRunner.query(`DROP TABLE "sensor_readings"`);
    await queryRunner.query(`DROP TABLE "camera_snapshots"`);
  }
}
