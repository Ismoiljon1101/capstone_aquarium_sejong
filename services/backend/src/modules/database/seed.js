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
exports.seedDatabase = seedDatabase;
var common_1 = require("@nestjs/common");
var tank_config_entity_1 = require("./entities/tank-config.entity");
var light_schedule_entity_1 = require("./entities/light-schedule.entity");
var logger = new common_1.Logger('DatabaseSeeder');
/**
 * Automatically seeds the database with default TankConfig and LightSchedule if they do not exist.
 * This ensures the application starts up with sane defaults and prevents null reference exceptions.
 */
function seedDatabase(dataSource) {
    return __awaiter(this, void 0, void 0, function () {
        var tankConfigRepo, tankConfigCount, defaultTankConfig, lightScheduleRepo, lightScheduleCount, defaultLightSchedule, queryRunner, tableExists, e_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 16, , 17]);
                    logger.log('Checking database seeding status...');
                    tankConfigRepo = dataSource.getRepository(tank_config_entity_1.TankConfigEntity);
                    return [4 /*yield*/, tankConfigRepo.count()];
                case 1:
                    tankConfigCount = _a.sent();
                    if (!(tankConfigCount === 0)) return [3 /*break*/, 3];
                    logger.log('No TankConfig found. Seeding default configuration (Singleton id=1)...');
                    defaultTankConfig = tankConfigRepo.create({
                        id: 1,
                        cleaningIntervalDays: 14,
                        emergencyTempMax: 30.0,
                        emergencyTempMin: 20.0,
                        emergencyDoMin: 4.0,
                        emergencyPhMin: 6.0,
                        emergencyPhMax: 8.5,
                        pushEnabled: true,
                        agentMode: 'confirm',
                        agentMonitorEnabled: true,
                    });
                    return [4 /*yield*/, tankConfigRepo.save(defaultTankConfig)];
                case 2:
                    _a.sent();
                    logger.log('Default TankConfig successfully seeded.');
                    return [3 /*break*/, 4];
                case 3:
                    logger.log('TankConfig already populated.');
                    _a.label = 4;
                case 4:
                    lightScheduleRepo = dataSource.getRepository(light_schedule_entity_1.LightScheduleEntity);
                    return [4 /*yield*/, lightScheduleRepo.count()];
                case 5:
                    lightScheduleCount = _a.sent();
                    if (!(lightScheduleCount === 0)) return [3 /*break*/, 7];
                    logger.log('No LightSchedule found. Seeding default 24h lighting schedule...');
                    defaultLightSchedule = lightScheduleRepo.create({
                        id: 1,
                        onTime: '07:00',
                        offTime: '21:00',
                        brightness: 80,
                        color: '#ffffff',
                        enabled: true,
                    });
                    return [4 /*yield*/, lightScheduleRepo.save(defaultLightSchedule)];
                case 6:
                    _a.sent();
                    logger.log('Default LightSchedule successfully seeded.');
                    return [3 /*break*/, 8];
                case 7:
                    logger.log('LightSchedule already populated.');
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 14, , 15]);
                    queryRunner = dataSource.createQueryRunner();
                    return [4 /*yield*/, queryRunner.connect()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.hasTable('sensor_readings')];
                case 10:
                    tableExists = _a.sent();
                    if (!tableExists) return [3 /*break*/, 12];
                    return [4 /*yield*/, queryRunner.query("DELETE FROM \"sensor_readings\" WHERE UPPER(\"type\") = 'CO2'")];
                case 11:
                    _a.sent();
                    logger.log('Cleaned up any legacy ghost CO2 sensor readings.');
                    _a.label = 12;
                case 12: return [4 /*yield*/, queryRunner.release()];
                case 13:
                    _a.sent();
                    return [3 /*break*/, 15];
                case 14:
                    e_1 = _a.sent();
                    logger.warn("Could not run CO2 ghost data cleanup: ".concat(e_1.message));
                    return [3 /*break*/, 15];
                case 15:
                    logger.log('Database seeding checks completed successfully.');
                    return [3 /*break*/, 17];
                case 16:
                    error_1 = _a.sent();
                    logger.error('Failed to check or seed database:', error_1.stack || error_1.message);
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/];
            }
        });
    });
}
