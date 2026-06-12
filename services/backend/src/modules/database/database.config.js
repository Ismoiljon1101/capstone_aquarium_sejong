"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseEntities = void 0;
exports.buildDatabaseOptions = buildDatabaseOptions;
var alert_entity_1 = require("./entities/alert.entity");
var camera_snapshot_entity_1 = require("./entities/camera-snapshot.entity");
var fish_count_entity_1 = require("./entities/fish-count.entity");
var fish_growth_entity_1 = require("./entities/fish-growth.entity");
var health_report_entity_1 = require("./entities/health-report.entity");
var sensor_reading_entity_1 = require("./entities/sensor-reading.entity");
var user_command_entity_1 = require("./entities/user-command.entity");
var voice_session_entity_1 = require("./entities/voice-session.entity");
exports.databaseEntities = [
    sensor_reading_entity_1.SensorReadingEntity,
    alert_entity_1.AlertEntity,
    camera_snapshot_entity_1.CameraSnapshotEntity,
    fish_count_entity_1.FishCount,
    fish_growth_entity_1.FishGrowth,
    health_report_entity_1.HealthReport,
    user_command_entity_1.UserCommandEntity,
    voice_session_entity_1.VoiceSessionEntity,
];
function buildDatabaseOptions(dbUrl) {
    var isPlaceholder = dbUrl === null || dbUrl === void 0 ? void 0 : dbUrl.includes('user:pass@host');
    if (!dbUrl || isPlaceholder) {
        return {
            type: 'better-sqlite3',
            database: ':memory:',
            entities: exports.databaseEntities,
            synchronize: true,
            logging: false,
        };
    }
    var isPostgres = dbUrl.startsWith('postgresql');
    return {
        type: isPostgres ? 'postgres' : 'sqlite',
        url: isPostgres ? dbUrl : undefined,
        database: isPostgres ? undefined : 'fishlinic.sqlite',
        entities: exports.databaseEntities,
        synchronize: true,
    };
}
