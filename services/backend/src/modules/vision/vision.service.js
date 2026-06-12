"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
exports.VisionService = void 0;
var common_1 = require("@nestjs/common");
var rxjs_1 = require("rxjs");
var AI_TIMEOUT_MS = 15000;
var VisionService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var VisionService = _classThis = /** @class */ (function () {
        function VisionService_1(http, config, sensors, fish, gateway, snapshotRepo) {
            var _a, _b;
            this.http = http;
            this.config = config;
            this.sensors = sensors;
            this.fish = fish;
            this.gateway = gateway;
            this.snapshotRepo = snapshotRepo;
            this.logger = new common_1.Logger(VisionService.name);
            this.aiUrl = (_a = this.config.get('AI_PREDICTOR_URL')) !== null && _a !== void 0 ? _a : 'http://localhost:8000';
            this.bridgeUrl =
                (_b = this.config.get('SERIAL_BRIDGE_URL')) !== null && _b !== void 0 ? _b : 'http://localhost:3001';
        }
        VisionService_1.prototype.requestSnapshot = function () {
            return __awaiter(this, arguments, void 0, function (triggeredBy) {
                var data, snapshot;
                var _a;
                if (triggeredBy === void 0) { triggeredBy = 'MANUAL'; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.logger.log("Requesting snapshot triggered by: ".concat(triggeredBy));
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.http
                                    .post("".concat(this.bridgeUrl, "/camera/snapshot"), {
                                    triggeredBy: triggeredBy,
                                })
                                    .pipe((0, rxjs_1.timeout)(AI_TIMEOUT_MS)))];
                        case 1:
                            data = (_b.sent()).data;
                            snapshot = this.snapshotRepo.create({
                                imagePath: data.imagePath,
                                triggeredBy: triggeredBy,
                            });
                            _a = {};
                            return [4 /*yield*/, this.snapshotRepo.save(snapshot)];
                        case 2: return [2 /*return*/, (_a.snapshot = _b.sent(),
                                _a.videoPath = data.videoPath,
                                _a)];
                    }
                });
            });
        };
        VisionService_1.prototype.detectDisease = function (imagePath) {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.http
                                .post("".concat(this.aiUrl, "/predict/disease"), { imagePath: imagePath })
                                .pipe((0, rxjs_1.timeout)(AI_TIMEOUT_MS)))];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        VisionService_1.prototype.countFish = function (imagePath) {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.http
                                .post("".concat(this.aiUrl, "/predict/count"), { imagePath: imagePath })
                                .pipe((0, rxjs_1.timeout)(AI_TIMEOUT_MS)))];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        VisionService_1.prototype.detectBehavior = function (videoPath, imagePath) {
            return __awaiter(this, void 0, void 0, function () {
                var data, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!videoPath) {
                                return [2 /*return*/, { status: 'unavailable', reason: 'video capture unavailable' }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.http
                                    .post("".concat(this.aiUrl, "/predict/behavior"), { videoPath: videoPath, imagePath: imagePath })
                                    .pipe((0, rxjs_1.timeout)(AI_TIMEOUT_MS)))];
                        case 2:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data];
                        case 3:
                            err_1 = _a.sent();
                            this.logger.warn("detectBehavior failed: ".concat(err_1.message));
                            return [2 /*return*/, { status: 'unavailable', reason: err_1.message }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        VisionService_1.prototype.getWaterQualityScore = function (readings) {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.http
                                .post("".concat(this.aiUrl, "/predict/quality"), readings)
                                .pipe((0, rxjs_1.timeout)(AI_TIMEOUT_MS)))];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        VisionService_1.prototype.runFullAnalysis = function () {
            return __awaiter(this, arguments, void 0, function (triggeredBy) {
                var _a, snapshot, videoPath, latestSensors, sensorMap, hasSensorData, _b, disease, count, behavior, quality, savedCount, sensorStatus, diseaseLabel, behaviorLabel, behaviorStatus, visualStatus, overallScore, confidencePct, report, error_1;
                var _this = this;
                var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                if (triggeredBy === void 0) { triggeredBy = 'MANUAL'; }
                return __generator(this, function (_o) {
                    switch (_o.label) {
                        case 0:
                            this.logger.log('Starting full vision analysis pipeline...');
                            _o.label = 1;
                        case 1:
                            _o.trys.push([1, 7, , 8]);
                            return [4 /*yield*/, this.requestSnapshot(triggeredBy)];
                        case 2:
                            _a = _o.sent(), snapshot = _a.snapshot, videoPath = _a.videoPath;
                            return [4 /*yield*/, this.sensors.getLatest()];
                        case 3:
                            latestSensors = _o.sent();
                            if (!latestSensors || latestSensors.length === 0) {
                                this.logger.warn('No sensor readings available, water quality score will be skipped');
                            }
                            sensorMap = (latestSensors !== null && latestSensors !== void 0 ? latestSensors : []).reduce(function (acc, s) {
                                var _a;
                                return (__assign(__assign({}, acc), (_a = {}, _a[s.type] = s.value, _a)));
                            }, {});
                            hasSensorData = Object.keys(sensorMap).length > 0;
                            return [4 /*yield*/, Promise.all([
                                    this.detectDisease(snapshot.imagePath).catch(function (err) {
                                        _this.logger.error("detectDisease failed: ".concat(err.message));
                                        return { disease: 'unknown', confidence: 0 };
                                    }),
                                    this.countFish(snapshot.imagePath).catch(function (err) {
                                        _this.logger.error("countFish failed: ".concat(err.message));
                                        return { count: 0, confidence: 0 };
                                    }),
                                    this.detectBehavior(videoPath, snapshot.imagePath).catch(function (err) {
                                        _this.logger.error("detectBehavior failed: ".concat(err.message));
                                        return { status: 'unknown' };
                                    }),
                                    hasSensorData
                                        ? this.getWaterQualityScore(sensorMap).catch(function (err) {
                                            _this.logger.error("getWaterQualityScore failed: ".concat(err.message));
                                            return { score: 0, label: 'unknown' };
                                        })
                                        : Promise.resolve({ score: 0, label: 'no_sensor_data' }),
                                ])];
                        case 4:
                            _b = _o.sent(), disease = _b[0], count = _b[1], behavior = _b[2], quality = _b[3];
                            return [4 /*yield*/, this.fish.saveCount(count.count, count.confidence, snapshot.snapshotId)];
                        case 5:
                            savedCount = _o.sent();
                            sensorStatus = this.buildSensorStatus(latestSensors !== null && latestSensors !== void 0 ? latestSensors : []);
                            diseaseLabel = (_c = disease.disease) !== null && _c !== void 0 ? _c : 'unknown';
                            behaviorLabel = (_e = (_d = behavior.label) !== null && _d !== void 0 ? _d : behavior.status) !== null && _e !== void 0 ? _e : 'unknown';
                            behaviorStatus = this.mapBehaviorStatus(String((_f = behavior.status) !== null && _f !== void 0 ? _f : 'warn'));
                            visualStatus = this.mapDiseaseStatus(diseaseLabel, Number((_g = disease.confidence) !== null && _g !== void 0 ? _g : 0));
                            overallScore = this.computeOverallScore([
                                sensorStatus.phStatus,
                                sensorStatus.tempStatus,
                                sensorStatus.doStatus,
                                visualStatus,
                                behaviorStatus,
                            ]);
                            confidencePct = Math.round(((_h = disease.confidence) !== null && _h !== void 0 ? _h : 0) * 100);
                            return [4 /*yield*/, this.fish.saveHealthReport({
                                    snapshotId: snapshot.snapshotId,
                                    phStatus: sensorStatus.phStatus,
                                    tempStatus: sensorStatus.tempStatus,
                                    doStatus: sensorStatus.doStatus,
                                    visualStatus: visualStatus,
                                    behaviorStatus: behaviorStatus,
                                    behaviorLabel: behaviorLabel,
                                    behaviorConfidence: Number((_j = behavior.confidence) !== null && _j !== void 0 ? _j : 0),
                                    overallScore: overallScore,
                                    summary: "AI report: disease ".concat(diseaseLabel, " (").concat(confidencePct, "% confidence). Behavior ").concat(behaviorLabel, ". Water quality ").concat((_l = (_k = quality.label) !== null && _k !== void 0 ? _k : quality.status) !== null && _l !== void 0 ? _l : 'unknown', "."),
                                    diseaseClass: diseaseLabel,
                                    mlConfidence: Number((_m = disease.confidence) !== null && _m !== void 0 ? _m : 0),
                                    severity: visualStatus === 'critical'
                                        ? 'High'
                                        : visualStatus === 'warn'
                                            ? 'Medium'
                                            : 'Low',
                                })];
                        case 6:
                            report = _o.sent();
                            this.gateway.emitFishCount({
                                count: savedCount.count,
                                timestamp: savedCount.timestamp.toISOString(),
                                snapshotId: savedCount.snapshotId,
                            });
                            this.gateway.emitHealthReport({
                                reportId: report.reportId,
                                phStatus: report.phStatus,
                                tempStatus: report.tempStatus,
                                doStatus: report.doStatus,
                                visualStatus: report.visualStatus,
                                behaviorStatus: report.behaviorStatus,
                                createdAt: report.timestamp.toISOString(),
                            });
                            return [2 /*return*/, {
                                    snapshotId: snapshot.snapshotId,
                                    videoPath: videoPath,
                                    disease: disease,
                                    count: count,
                                    behavior: behavior,
                                    quality: quality,
                                    hasSensorData: hasSensorData,
                                    reportId: report.reportId,
                                }];
                        case 7:
                            error_1 = _o.sent();
                            this.logger.error("Vision analysis pipeline failed: ".concat(error_1.message), error_1.stack);
                            throw error_1;
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        VisionService_1.prototype.getLatestReport = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.fish.getLatestReport()];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        VisionService_1.prototype.getSnapshot = function (snapshotId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.snapshotRepo.findOne({ where: { snapshotId: snapshotId } })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /** Returns the latest fish count and health report without triggering a new capture. */
        VisionService_1.prototype.getLatestSummary = function () {
            return __awaiter(this, void 0, void 0, function () {
                var report, latestCount, latestSnapshot, diseaseName;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.getLatestReport()];
                        case 1:
                            report = _d.sent();
                            return [4 /*yield*/, this.fish.getLatestCount()];
                        case 2:
                            latestCount = _d.sent();
                            return [4 /*yield*/, this.snapshotRepo.find({
                                    order: { snapshotId: 'DESC' },
                                    take: 1,
                                })];
                        case 3:
                            latestSnapshot = (_d.sent())[0];
                            diseaseName = (_a = report === null || report === void 0 ? void 0 : report.visualStatus) !== null && _a !== void 0 ? _a : 'unknown';
                            if (diseaseName === 'HF Healthy Fish') {
                                diseaseName = 'healthy';
                            }
                            else if (diseaseName === 'BD Bacterial Disease') {
                                diseaseName = 'Bacterial Disease';
                            }
                            else if (diseaseName === 'FD Fungal Disease') {
                                diseaseName = 'Fungal Disease';
                            }
                            else if (diseaseName === 'PD Parasitic Disease') {
                                diseaseName = 'Parasitic Disease';
                            }
                            return [2 /*return*/, {
                                    fishCount: (_b = latestCount === null || latestCount === void 0 ? void 0 : latestCount.count) !== null && _b !== void 0 ? _b : 0,
                                    disease: diseaseName,
                                    confidence: (_c = latestCount === null || latestCount === void 0 ? void 0 : latestCount.confidence) !== null && _c !== void 0 ? _c : 0.97,
                                    imagePath: latestSnapshot
                                        ? "/vision/snapshots/".concat(latestSnapshot.snapshotId, "/image")
                                        : null,
                                    timestamp: latestSnapshot
                                        ? latestSnapshot.timestamp.toISOString()
                                        : new Date(0).toISOString(),
                                }];
                    }
                });
            });
        };
        VisionService_1.prototype.buildSensorStatus = function (readings) {
            var _a, _b, _c, _d;
            var statusByType = new Map();
            for (var _i = 0, readings_1 = readings; _i < readings_1.length; _i++) {
                var reading = readings_1[_i];
                statusByType.set(reading.type, ((_a = reading.status) !== null && _a !== void 0 ? _a : 'ok'));
            }
            return {
                phStatus: (_b = statusByType.get('pH')) !== null && _b !== void 0 ? _b : 'ok',
                tempStatus: (_c = statusByType.get('temp_c')) !== null && _c !== void 0 ? _c : 'ok',
                doStatus: (_d = statusByType.get('do_mg_l')) !== null && _d !== void 0 ? _d : 'ok',
            };
        };
        VisionService_1.prototype.mapDiseaseStatus = function (label, confidence) {
            var normalized = label.toLowerCase();
            if (normalized === 'none' || normalized === 'healthy')
                return 'ok';
            if (normalized === 'unknown')
                return 'warn';
            return confidence >= 0.8 ? 'critical' : 'warn';
        };
        VisionService_1.prototype.mapBehaviorStatus = function (status) {
            if (status === 'ok')
                return 'ok';
            if (status === 'critical')
                return 'critical';
            return 'warn';
        };
        VisionService_1.prototype.computeOverallScore = function (statuses) {
            var score = 1;
            for (var _i = 0, statuses_1 = statuses; _i < statuses_1.length; _i++) {
                var status_1 = statuses_1[_i];
                if (status_1 === 'warn')
                    score -= 0.1;
                if (status_1 === 'critical')
                    score -= 0.25;
            }
            return Math.max(0, Number(score.toFixed(2)));
        };
        return VisionService_1;
    }());
    __setFunctionName(_classThis, "VisionService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VisionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VisionService = _classThis;
}();
exports.VisionService = VisionService;
