"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
var common_1 = require("@nestjs/common");
var schedule_1 = require("@nestjs/schedule");
var CronService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _checkSensorThresholds_decorators;
    var _runVisionAnalysis_decorators;
    var _triggerAutoFeed_decorators;
    var _dailyHealthReport_decorators;
    var _fishGrowthMonitor_decorators;
    var _weeklyExport_decorators;
    var _checkEmergencyConditions_decorators;
    var CronService = _classThis = /** @class */ (function () {
        function CronService_1(sensors, vision, actuators, fish, alerts) {
            this.sensors = (__runInitializers(this, _instanceExtraInitializers), sensors);
            this.vision = vision;
            this.actuators = actuators;
            this.fish = fish;
            this.alerts = alerts;
            this.logger = new common_1.Logger(CronService.name);
        }
        CronService_1.prototype.checkSensorThresholds = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Checking sensor thresholds...');
                            return [4 /*yield*/, this.sensors.checkThresholds()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        CronService_1.prototype.runVisionAnalysis = function () {
            return __awaiter(this, void 0, void 0, function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Running automated vision analysis (count + behavior)...');
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 5]);
                            return [4 /*yield*/, this.vision.runFullAnalysis('CRON')];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 3:
                            error_1 = _a.sent();
                            this.logger.error("Automated vision analysis failed: ".concat(error_1.message));
                            return [4 /*yield*/, this.alerts.createAlert({
                                    sensorId: 0,
                                    tankId: 1,
                                    type: 'SYSTEM',
                                    severity: 'WARNING',
                                    message: "Automated vision analysis failed: ".concat(error_1.message),
                                })];
                        case 4:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        CronService_1.prototype.triggerAutoFeed = function () {
            return __awaiter(this, void 0, void 0, function () {
                var command;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Triggering automated fish feeding...');
                            command = {
                                actuatorId: 1,
                                type: 'FEEDER',
                                relayChannel: 1,
                                state: true,
                                source: 'CRON',
                            };
                            return [4 /*yield*/, this.actuators.triggerActuator(command)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        CronService_1.prototype.dailyHealthReport = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Generating daily automated health report from fresh camera and sensors...');
                            return [4 /*yield*/, this.vision.runFullAnalysis('CRON_DAILY')];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        CronService_1.prototype.fishGrowthMonitor = function () {
            return __awaiter(this, void 0, void 0, function () {
                var result, error_2;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.logger.log('Running daily fish growth comparison...');
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 5, , 6]);
                            return [4 /*yield*/, this.vision.runFullAnalysis('CRON_GROWTH')];
                        case 2:
                            result = _b.sent();
                            if (!(((_a = result.count) === null || _a === void 0 ? void 0 : _a.count) > 0)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.fish.saveGrowthRecord(result.count.count * 2.1, result.count.count)];
                        case 3:
                            _b.sent();
                            _b.label = 4;
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            error_2 = _b.sent();
                            this.logger.error("Fish growth monitor failed: ".concat(error_2.message));
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        CronService_1.prototype.weeklyExport = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, sensorHistory, healthHistory, growthHistory, exportData, error_3;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.logger.log('Generating weekly JSONL export...');
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 5]);
                            return [4 /*yield*/, Promise.all([
                                    this.sensors.getHistory(0, '1w'),
                                    this.fish.getHealthHistory(),
                                    this.fish.getGrowthHistory(),
                                ])];
                        case 2:
                            _a = _b.sent(), sensorHistory = _a[0], healthHistory = _a[1], growthHistory = _a[2];
                            exportData = {
                                exportedAt: new Date().toISOString(),
                                sensors: sensorHistory,
                                health: healthHistory,
                                growth: growthHistory,
                            };
                            this.logger.log("Weekly export generated: ".concat(JSON.stringify(exportData).length, " bytes"));
                            return [2 /*return*/, exportData];
                        case 3:
                            error_3 = _b.sent();
                            this.logger.error("Weekly export failed: ".concat(error_3.message));
                            return [4 /*yield*/, this.alerts.createAlert({
                                    sensorId: 0,
                                    tankId: 1,
                                    type: 'SYSTEM',
                                    severity: 'WARNING',
                                    message: "Weekly export failed: ".concat(error_3.message),
                                })];
                        case 4:
                            _b.sent();
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        CronService_1.prototype.checkEmergencyConditions = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Performing deep emergency conditions check...');
                            return [4 /*yield*/, this.alerts.checkEmergencyConditions()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return CronService_1;
    }());
    __setFunctionName(_classThis, "CronService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _checkSensorThresholds_decorators = [(0, schedule_1.Cron)('*/1 * * * *')];
        _runVisionAnalysis_decorators = [(0, schedule_1.Cron)('*/5 * * * *')];
        _triggerAutoFeed_decorators = [(0, schedule_1.Cron)('0 */8 * * *')];
        _dailyHealthReport_decorators = [(0, schedule_1.Cron)('0 6 * * *')];
        _fishGrowthMonitor_decorators = [(0, schedule_1.Cron)('0 7 * * *')];
        _weeklyExport_decorators = [(0, schedule_1.Cron)('0 0 * * 0')];
        _checkEmergencyConditions_decorators = [(0, schedule_1.Cron)('*/30 * * * *')];
        __esDecorate(_classThis, null, _checkSensorThresholds_decorators, { kind: "method", name: "checkSensorThresholds", static: false, private: false, access: { has: function (obj) { return "checkSensorThresholds" in obj; }, get: function (obj) { return obj.checkSensorThresholds; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _runVisionAnalysis_decorators, { kind: "method", name: "runVisionAnalysis", static: false, private: false, access: { has: function (obj) { return "runVisionAnalysis" in obj; }, get: function (obj) { return obj.runVisionAnalysis; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _triggerAutoFeed_decorators, { kind: "method", name: "triggerAutoFeed", static: false, private: false, access: { has: function (obj) { return "triggerAutoFeed" in obj; }, get: function (obj) { return obj.triggerAutoFeed; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _dailyHealthReport_decorators, { kind: "method", name: "dailyHealthReport", static: false, private: false, access: { has: function (obj) { return "dailyHealthReport" in obj; }, get: function (obj) { return obj.dailyHealthReport; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _fishGrowthMonitor_decorators, { kind: "method", name: "fishGrowthMonitor", static: false, private: false, access: { has: function (obj) { return "fishGrowthMonitor" in obj; }, get: function (obj) { return obj.fishGrowthMonitor; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _weeklyExport_decorators, { kind: "method", name: "weeklyExport", static: false, private: false, access: { has: function (obj) { return "weeklyExport" in obj; }, get: function (obj) { return obj.weeklyExport; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _checkEmergencyConditions_decorators, { kind: "method", name: "checkEmergencyConditions", static: false, private: false, access: { has: function (obj) { return "checkEmergencyConditions" in obj; }, get: function (obj) { return obj.checkEmergencyConditions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CronService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CronService = _classThis;
}();
exports.CronService = CronService;
