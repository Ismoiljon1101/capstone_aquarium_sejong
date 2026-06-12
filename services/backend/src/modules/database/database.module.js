"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var config_1 = require("@nestjs/config");
var path = require("path");
var sensor_reading_entity_1 = require("./entities/sensor-reading.entity");
var alert_entity_1 = require("./entities/alert.entity");
var camera_snapshot_entity_1 = require("./entities/camera-snapshot.entity");
var fish_count_entity_1 = require("./entities/fish-count.entity");
var health_report_entity_1 = require("./entities/health-report.entity");
var user_command_entity_1 = require("./entities/user-command.entity");
var voice_session_entity_1 = require("./entities/voice-session.entity");
var feed_schedule_entity_1 = require("./entities/feed-schedule.entity");
var light_schedule_entity_1 = require("./entities/light-schedule.entity");
var tank_config_entity_1 = require("./entities/tank-config.entity");
var actuator_event_entity_1 = require("./entities/actuator-event.entity");
var fish_growth_entity_1 = require("./entities/fish-growth.entity");
var chat_message_entity_1 = require("./entities/chat-message.entity");
var database_service_1 = require("./database.service");
var database_controller_1 = require("./database.controller");
var DatabaseModule = function () {
    var _classDecorators = [(0, common_1.Module)({
            imports: [
                typeorm_1.TypeOrmModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (configService) {
                        var dbUrl = configService.get('DATABASE_URL');
                        var isPlaceholder = dbUrl === null || dbUrl === void 0 ? void 0 : dbUrl.includes('user:pass@host');
                        var entitiesList = [
                            sensor_reading_entity_1.SensorReadingEntity, alert_entity_1.AlertEntity, camera_snapshot_entity_1.CameraSnapshotEntity,
                            fish_count_entity_1.FishCount, health_report_entity_1.HealthReport, user_command_entity_1.UserCommandEntity, voice_session_entity_1.VoiceSessionEntity,
                            feed_schedule_entity_1.FeedScheduleEntity, light_schedule_entity_1.LightScheduleEntity, tank_config_entity_1.TankConfigEntity, actuator_event_entity_1.ActuatorEventEntity, fish_growth_entity_1.FishGrowth, chat_message_entity_1.ChatMessageEntity,
                        ];
                        if (!dbUrl || isPlaceholder) {
                            // Dev/demo fallback: persist to local file so data survives restarts
                            return {
                                type: 'better-sqlite3',
                                database: 'fishlinic.sqlite',
                                entities: entitiesList,
                                synchronize: true,
                                logging: false,
                            };
                        }
                        var isPostgres = dbUrl.startsWith('postgresql') || dbUrl.startsWith('postgres');
                        if (isPostgres) {
                            return {
                                type: 'postgres',
                                url: dbUrl,
                                entities: entitiesList,
                                synchronize: false,
                                migrationsRun: true,
                                migrations: [path.join(__dirname, '/../../migrations/*{.ts,.js}')],
                                ssl: { rejectUnauthorized: false },
                            };
                        }
                        return {
                            type: 'better-sqlite3',
                            database: 'fishlinic.sqlite',
                            entities: entitiesList,
                            synchronize: true,
                            logging: false,
                        };
                    },
                }),
                typeorm_1.TypeOrmModule.forFeature([
                    sensor_reading_entity_1.SensorReadingEntity, alert_entity_1.AlertEntity, camera_snapshot_entity_1.CameraSnapshotEntity,
                    fish_count_entity_1.FishCount, health_report_entity_1.HealthReport, user_command_entity_1.UserCommandEntity, voice_session_entity_1.VoiceSessionEntity,
                    feed_schedule_entity_1.FeedScheduleEntity, light_schedule_entity_1.LightScheduleEntity, tank_config_entity_1.TankConfigEntity, actuator_event_entity_1.ActuatorEventEntity, fish_growth_entity_1.FishGrowth, chat_message_entity_1.ChatMessageEntity,
                ]),
            ],
            controllers: [database_controller_1.DatabaseController],
            providers: [database_service_1.DatabaseService],
            exports: [typeorm_1.TypeOrmModule, database_service_1.DatabaseService],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DatabaseModule = _classThis = /** @class */ (function () {
        function DatabaseModule_1() {
        }
        return DatabaseModule_1;
    }());
    __setFunctionName(_classThis, "DatabaseModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DatabaseModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DatabaseModule = _classThis;
}();
exports.DatabaseModule = DatabaseModule;
