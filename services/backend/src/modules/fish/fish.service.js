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
exports.FishService = void 0;
var common_1 = require("@nestjs/common");
var FishService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var FishService = _classThis = /** @class */ (function () {
        function FishService_1(fishCountRepo, healthReportRepo, fishGrowthRepo, gateway, alerts) {
            this.fishCountRepo = fishCountRepo;
            this.healthReportRepo = healthReportRepo;
            this.fishGrowthRepo = fishGrowthRepo;
            this.gateway = gateway;
            this.alerts = alerts;
            this.logger = new common_1.Logger(FishService.name);
        }
        FishService_1.prototype.saveCount = function (count, confidence, snapshotId) {
            return __awaiter(this, void 0, void 0, function () {
                var record;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            record = this.fishCountRepo.create({
                                snapshotId: snapshotId,
                                count: count,
                                confidence: confidence,
                                timestamp: new Date(),
                            });
                            return [4 /*yield*/, this.fishCountRepo.save(record)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        FishService_1.prototype.saveHealthReport = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var report;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            report = this.healthReportRepo.create({
                                snapshotId: data.snapshotId,
                                phStatus: data.phStatus,
                                tempStatus: data.tempStatus,
                                doStatus: data.doStatus,
                                visualStatus: data.visualStatus,
                                behaviorStatus: data.behaviorStatus,
                                behaviorLabel: data.behaviorLabel,
                                behaviorConfidence: data.behaviorConfidence,
                                overallScore: data.overallScore,
                                summary: data.summary,
                                diseaseClass: data.diseaseClass,
                                mlConfidence: data.mlConfidence,
                                severity: data.severity,
                                source: (_a = data.source) !== null && _a !== void 0 ? _a : 'vision_pipeline',
                                timestamp: new Date(),
                            });
                            return [4 /*yield*/, this.healthReportRepo.save(report)];
                        case 1: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        FishService_1.prototype.saveGrowthRecord = function (avgSize, count) {
            return __awaiter(this, void 0, void 0, function () {
                var lastRecord, delta, growth;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.fishGrowthRepo.findOne({
                                where: {},
                                order: { createdAt: 'DESC' },
                            })];
                        case 1:
                            lastRecord = _a.sent();
                            delta = lastRecord ? avgSize - lastRecord.avgSizeEstimate : 0;
                            growth = this.fishGrowthRepo.create({
                                date: new Date().toISOString().split('T')[0],
                                avgSizeEstimate: avgSize,
                                count: count,
                                deltaFromPrev: delta,
                            });
                            return [4 /*yield*/, this.fishGrowthRepo.save(growth)];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        FishService_1.prototype.saveDiagnosis = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var isHealthy, report, saved;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            isHealthy = data.diseaseClass.toLowerCase() === 'healthy';
                            report = this.healthReportRepo.create({
                                visualStatus: isHealthy ? 'ok' : 'warn',
                                behaviorStatus: 'ok',
                                overallScore: data.confidence,
                                summary: (_a = data.summary) !== null && _a !== void 0 ? _a : "ML detected: ".concat(data.diseaseClass, " (").concat((data.confidence * 100).toFixed(1), "% confidence)"),
                                diseaseClass: data.diseaseClass,
                                mlConfidence: data.confidence,
                                severity: data.severity,
                                fishId: data.fishId,
                                source: 'ml_model',
                            });
                            return [4 /*yield*/, this.healthReportRepo.save(report)];
                        case 1:
                            saved = _b.sent();
                            this.gateway.emitHealthReport(saved);
                            if (!(!isHealthy && data.severity !== 'Low')) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.alerts.createAlert({
                                    sensorId: 0,
                                    tankId: 1,
                                    type: 'FISH_DISEASE',
                                    severity: data.severity === 'High' ? 'critical' : 'warning',
                                    message: "Fish disease detected: ".concat(data.diseaseClass, " (").concat(data.severity, " severity, ").concat((data.confidence * 100).toFixed(1), "% confidence)"),
                                })];
                        case 2:
                            _b.sent();
                            _b.label = 3;
                        case 3: return [2 /*return*/, saved];
                    }
                });
            });
        };
        FishService_1.prototype.saveAnomaly = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.alerts.createAlert({
                                sensorId: (_a = data.readingId) !== null && _a !== void 0 ? _a : 0,
                                tankId: 1,
                                type: 'WATER_ANOMALY',
                                severity: data.severity === 'High' ? 'critical' : 'warning',
                                message: (_b = data.message) !== null && _b !== void 0 ? _b : "Water quality anomaly: ".concat(data.anomalyType, " (").concat(data.severity, ")"),
                            })];
                        case 1:
                            _c.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        FishService_1.prototype.getLatestDiagnoses = function () {
            return __awaiter(this, arguments, void 0, function (limit) {
                if (limit === void 0) { limit = 10; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.healthReportRepo.find({
                            where: { source: 'ml_model' },
                            order: { timestamp: 'DESC' },
                            take: limit,
                        })];
                });
            });
        };
        FishService_1.prototype.generateDailyReport = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Generating daily fish health report...');
                            return [4 /*yield*/, this.saveHealthReport({
                                    phStatus: 'ok',
                                    tempStatus: 'ok',
                                    doStatus: 'ok',
                                    visualStatus: 'ok',
                                    behaviorStatus: 'ok',
                                    overallScore: 1,
                                    summary: 'Daily automated report placeholder.',
                                    source: 'manual',
                                })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        FishService_1.prototype.getLatestCount = function () {
            return __awaiter(this, void 0, void 0, function () {
                var rows;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.fishCountRepo.find({
                                order: { timestamp: 'DESC' },
                                take: 1,
                            })];
                        case 1:
                            rows = _b.sent();
                            return [2 /*return*/, (_a = rows[0]) !== null && _a !== void 0 ? _a : null];
                    }
                });
            });
        };
        FishService_1.prototype.getLatestReport = function () {
            return __awaiter(this, void 0, void 0, function () {
                var rows;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.healthReportRepo.find({
                                order: { timestamp: 'DESC' },
                                take: 1,
                            })];
                        case 1:
                            rows = _b.sent();
                            return [2 /*return*/, (_a = rows[0]) !== null && _a !== void 0 ? _a : null];
                    }
                });
            });
        };
        FishService_1.prototype.getHealthHistory = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.healthReportRepo.find({
                                order: { timestamp: 'DESC' },
                                take: 20,
                            })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        FishService_1.prototype.getGrowthHistory = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.fishGrowthRepo.find({
                                order: { createdAt: 'DESC' },
                                take: 30,
                            })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        return FishService_1;
    }());
    __setFunctionName(_classThis, "FishService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FishService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FishService = _classThis;
}();
exports.FishService = FishService;
