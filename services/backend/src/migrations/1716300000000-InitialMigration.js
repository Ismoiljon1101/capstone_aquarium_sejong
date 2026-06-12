"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialMigration1716300000000 = void 0;
var InitialMigration1716300000000 = /** @class */ (function () {
    function InitialMigration1716300000000() {
        this.name = 'InitialMigration1716300000000';
    }
    InitialMigration1716300000000.prototype.up = function (queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // 1. Create camera_snapshots first because fish_counts references it
                    return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"camera_snapshots\" (\n        \"snapshotId\" SERIAL PRIMARY KEY,\n        \"imagePath\" varchar NOT NULL,\n        \"triggeredBy\" varchar NOT NULL,\n        \"timestamp\" TIMESTAMPTZ NOT NULL DEFAULT now()\n      )\n    ")];
                    case 1:
                        // 1. Create camera_snapshots first because fish_counts references it
                        _a.sent();
                        // 2. Create sensor_readings
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"sensor_readings\" (\n        \"readingId\" SERIAL PRIMARY KEY,\n        \"sensorId\" integer NOT NULL,\n        \"type\" varchar NOT NULL,\n        \"value\" double precision NOT NULL,\n        \"unit\" varchar NOT NULL,\n        \"status\" varchar NOT NULL DEFAULT 'ok',\n        \"timestamp\" TIMESTAMPTZ NOT NULL DEFAULT now()\n      )\n    ")];
                    case 2:
                        // 2. Create sensor_readings
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE INDEX \"IDX_sensor_readings_sensorId\" ON \"sensor_readings\" (\"sensorId\")")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE INDEX \"IDX_sensor_readings_type\" ON \"sensor_readings\" (\"type\")")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE INDEX \"IDX_sensor_readings_timestamp\" ON \"sensor_readings\" (\"timestamp\")")];
                    case 5:
                        _a.sent();
                        // 3. Create alerts
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"alerts\" (\n        \"alertId\" SERIAL PRIMARY KEY,\n        \"sensorId\" integer NOT NULL,\n        \"tankId\" integer NOT NULL,\n        \"type\" varchar NOT NULL,\n        \"severity\" varchar NOT NULL,\n        \"message\" text NOT NULL,\n        \"acknowledged\" boolean NOT NULL DEFAULT false,\n        \"createdAt\" TIMESTAMPTZ NOT NULL DEFAULT now()\n      )\n    ")];
                    case 6:
                        // 3. Create alerts
                        _a.sent();
                        // 4. Create fish_counts
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"fish_counts\" (\n        \"countId\" SERIAL PRIMARY KEY,\n        \"snapshotId\" integer NOT NULL,\n        \"count\" integer NOT NULL,\n        \"confidence\" double precision NOT NULL,\n        \"timestamp\" TIMESTAMPTZ NOT NULL DEFAULT now(),\n        CONSTRAINT \"FK_fish_counts_snapshot\" FOREIGN KEY (\"snapshotId\") REFERENCES \"camera_snapshots\" (\"snapshotId\") ON DELETE CASCADE\n      )\n    ")];
                    case 7:
                        // 4. Create fish_counts
                        _a.sent();
                        // 5. Create health_reports
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"health_reports\" (\n        \"reportId\" SERIAL PRIMARY KEY,\n        \"snapshotId\" integer,\n        \"phStatus\" varchar NOT NULL DEFAULT 'ok',\n        \"tempStatus\" varchar NOT NULL DEFAULT 'ok',\n        \"doStatus\" varchar NOT NULL DEFAULT 'ok',\n        \"visualStatus\" varchar NOT NULL DEFAULT 'ok',\n        \"behaviorStatus\" varchar NOT NULL DEFAULT 'ok',\n        \"overallScore\" double precision NOT NULL DEFAULT 1.0,\n        \"summary\" text NOT NULL DEFAULT '',\n        \"diseaseClass\" varchar,\n        \"mlConfidence\" double precision,\n        \"severity\" varchar,\n        \"fishId\" integer,\n        \"source\" varchar NOT NULL DEFAULT 'manual',\n        \"timestamp\" TIMESTAMPTZ NOT NULL DEFAULT now()\n      )\n    ")];
                    case 8:
                        // 5. Create health_reports
                        _a.sent();
                        // 6. Create feed_schedules
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"feed_schedules\" (\n        \"id\" SERIAL PRIMARY KEY,\n        \"time\" varchar NOT NULL,\n        \"daysMask\" integer NOT NULL DEFAULT 127,\n        \"portionSec\" integer NOT NULL DEFAULT 3,\n        \"enabled\" boolean NOT NULL DEFAULT true,\n        \"lastFiredAt\" TIMESTAMPTZ,\n        \"createdAt\" TIMESTAMPTZ NOT NULL DEFAULT now()\n      )\n    ")];
                    case 9:
                        // 6. Create feed_schedules
                        _a.sent();
                        // 7. Create light_schedules
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"light_schedules\" (\n        \"id\" SERIAL PRIMARY KEY,\n        \"onTime\" varchar NOT NULL DEFAULT '07:00',\n        \"offTime\" varchar NOT NULL DEFAULT '21:00',\n        \"brightness\" integer NOT NULL DEFAULT 80,\n        \"color\" varchar NOT NULL DEFAULT '#ffffff',\n        \"enabled\" boolean NOT NULL DEFAULT true,\n        \"createdAt\" TIMESTAMPTZ NOT NULL DEFAULT now()\n      )\n    ")];
                    case 10:
                        // 7. Create light_schedules
                        _a.sent();
                        // 8. Create tank_config
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"tank_config\" (\n        \"id\" integer PRIMARY KEY DEFAULT 1,\n        \"cleaningIntervalDays\" integer NOT NULL DEFAULT 14,\n        \"lastCleanedAt\" TIMESTAMPTZ,\n        \"emergencyTempMax\" double precision NOT NULL DEFAULT 30.0,\n        \"emergencyTempMin\" double precision NOT NULL DEFAULT 20.0,\n        \"emergencyDoMin\" double precision NOT NULL DEFAULT 4.0,\n        \"emergencyPhMin\" double precision NOT NULL DEFAULT 6.0,\n        \"emergencyPhMax\" double precision NOT NULL DEFAULT 8.5,\n        \"pushToken\" varchar,\n        \"pushEnabled\" boolean NOT NULL DEFAULT true,\n        \"agentMode\" varchar NOT NULL DEFAULT 'confirm',\n        \"agentMonitorEnabled\" boolean NOT NULL DEFAULT true,\n        \"updatedAt\" TIMESTAMPTZ NOT NULL DEFAULT now()\n      )\n    ")];
                    case 11:
                        // 8. Create tank_config
                        _a.sent();
                        // 9. Create actuator_events
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"actuator_events\" (\n        \"id\" SERIAL PRIMARY KEY,\n        \"type\" varchar NOT NULL,\n        \"state\" boolean NOT NULL,\n        \"source\" varchar NOT NULL,\n        \"reason\" varchar,\n        \"timestamp\" TIMESTAMPTZ NOT NULL DEFAULT now()\n      )\n    ")];
                    case 12:
                        // 9. Create actuator_events
                        _a.sent();
                        // 10. Create chat_messages
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"chat_messages\" (\n        \"id\" SERIAL PRIMARY KEY,\n        \"sessionId\" varchar NOT NULL,\n        \"role\" varchar NOT NULL,\n        \"content\" text NOT NULL,\n        \"createdAt\" TIMESTAMPTZ NOT NULL DEFAULT now()\n      )\n    ")];
                    case 13:
                        // 10. Create chat_messages
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE INDEX \"IDX_chat_messages_sessionId_createdAt\" ON \"chat_messages\" (\"sessionId\", \"createdAt\")")];
                    case 14:
                        _a.sent();
                        // 11. Create user_commands
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"user_commands\" (\n        \"commandId\" SERIAL PRIMARY KEY,\n        \"actuatorId\" integer NOT NULL,\n        \"commandType\" varchar NOT NULL,\n        \"source\" varchar NOT NULL,\n        \"payload\" text,\n        \"createdAt\" TIMESTAMPTZ NOT NULL DEFAULT now(),\n        \"executedAt\" TIMESTAMPTZ\n      )\n    ")];
                    case 15:
                        // 11. Create user_commands
                        _a.sent();
                        // 12. Create fish_growth
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"fish_growth\" (\n        \"growthId\" SERIAL PRIMARY KEY,\n        \"date\" varchar NOT NULL,\n        \"avgSizeEstimate\" double precision NOT NULL,\n        \"count\" integer NOT NULL,\n        \"deltaFromPrev\" double precision NOT NULL DEFAULT 0,\n        \"createdAt\" TIMESTAMPTZ NOT NULL DEFAULT now()\n      )\n    ")];
                    case 16:
                        // 12. Create fish_growth
                        _a.sent();
                        // 13. Create voice_sessions
                        return [4 /*yield*/, queryRunner.query("\n      CREATE TABLE \"voice_sessions\" (\n        \"sessionId\" SERIAL PRIMARY KEY,\n        \"snapshotId\" integer,\n        \"wakeWordAt\" TIMESTAMPTZ NOT NULL,\n        \"transcribedText\" text NOT NULL,\n        \"aiResponse\" text NOT NULL,\n        \"audioOutputPath\" varchar,\n        \"durationMs\" integer NOT NULL,\n        \"createdAt\" TIMESTAMPTZ NOT NULL DEFAULT now()\n      )\n    ")];
                    case 17:
                        // 13. Create voice_sessions
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    InitialMigration1716300000000.prototype.down = function (queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("DROP TABLE \"voice_sessions\"")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"fish_growth\"")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"user_commands\"")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP INDEX \"IDX_chat_messages_sessionId_createdAt\"")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"chat_messages\"")];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"actuator_events\"")];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"tank_config\"")];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"light_schedules\"")];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"feed_schedules\"")];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"health_reports\"")];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"fish_counts\"")];
                    case 11:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"alerts\"")];
                    case 12:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP INDEX \"IDX_sensor_readings_timestamp\"")];
                    case 13:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP INDEX \"IDX_sensor_readings_type\"")];
                    case 14:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP INDEX \"IDX_sensor_readings_sensorId\"")];
                    case 15:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"sensor_readings\"")];
                    case 16:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"camera_snapshots\"")];
                    case 17:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return InitialMigration1716300000000;
}());
exports.InitialMigration1716300000000 = InitialMigration1716300000000;
