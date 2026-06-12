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
exports.SchedulerService = void 0;
var common_1 = require("@nestjs/common");
/**
 * Dynamic scheduler.
 * Wakes every 60s and:
 *   1. Fires any feed schedule whose HH:MM matches now (and that hasn't already
 *      fired this minute) on the correct weekday.
 *   2. Toggles LED based on the configured on/off times.
 *   3. Checks emergency thresholds against the latest sensor readings.
 *   4. Once per hour, checks the cleaning reminder interval.
 *
 * All triggers go through the existing ActuatorsService.triggerActuator(), so
 * when real hardware is plugged into the serial bridge nothing else changes.
 */
var SchedulerService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SchedulerService = _classThis = /** @class */ (function () {
        function SchedulerService_1(mgmt, actuators, sensors, alerts) {
            this.mgmt = mgmt;
            this.actuators = actuators;
            this.sensors = sensors;
            this.alerts = alerts;
            this.logger = new common_1.Logger(SchedulerService.name);
            this.timer = null;
            this.lastLedState = null;
            this.lastCleanCheckHour = -1;
        }
        SchedulerService_1.prototype.onModuleInit = function () {
            var _this = this;
            this.logger.log('Dynamic scheduler started (60s tick)');
            this.tick().catch(function (e) { return _this.logger.error("tick failed: ".concat(e.message)); });
            this.timer = setInterval(function () { return _this.tick().catch(function (e) { return _this.logger.error("tick failed: ".concat(e.message)); }); }, 60000);
        };
        SchedulerService_1.prototype.onModuleDestroy = function () {
            if (this.timer)
                clearInterval(this.timer);
        };
        SchedulerService_1.prototype.hhmm = function (d) {
            return "".concat(String(d.getHours()).padStart(2, '0'), ":").concat(String(d.getMinutes()).padStart(2, '0'));
        };
        SchedulerService_1.prototype.tick = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now, currHHMM, dayBit;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = new Date();
                            currHHMM = this.hhmm(now);
                            dayBit = 1 << now.getDay();
                            return [4 /*yield*/, Promise.all([
                                    this.checkFeedSchedules(now, currHHMM, dayBit),
                                    this.checkLightSchedule(currHHMM),
                                    this.checkEmergency(),
                                    this.checkCleaningReminder(now),
                                ])];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        // ── Feed ──────────────────────────────────────────────────────────────────
        SchedulerService_1.prototype.checkFeedSchedules = function (now, currHHMM, dayBit) {
            return __awaiter(this, void 0, void 0, function () {
                var schedules, _i, schedules_1, s;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.mgmt.listFeedSchedules()];
                        case 1:
                            schedules = _a.sent();
                            _i = 0, schedules_1 = schedules;
                            _a.label = 2;
                        case 2:
                            if (!(_i < schedules_1.length)) return [3 /*break*/, 6];
                            s = schedules_1[_i];
                            if (!s.enabled)
                                return [3 /*break*/, 5];
                            if ((s.daysMask & dayBit) === 0)
                                return [3 /*break*/, 5];
                            if (s.time !== currHHMM)
                                return [3 /*break*/, 5];
                            // Don't double-fire within the same minute
                            if (s.lastFiredAt && now.getTime() - new Date(s.lastFiredAt).getTime() < 55000)
                                return [3 /*break*/, 5];
                            this.logger.log("Firing scheduled feed #".concat(s.id, " at ").concat(s.time, " (").concat(s.portionSec, "s)"));
                            return [4 /*yield*/, this.actuators.triggerActuator({
                                    actuatorId: 1, type: 'FEEDER', relayChannel: 1, state: true, source: 'CRON',
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.mgmt.markFeedFired(s.id)];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 2];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Light ─────────────────────────────────────────────────────────────────
        SchedulerService_1.prototype.checkLightSchedule = function (currHHMM) {
            return __awaiter(this, void 0, void 0, function () {
                var cfg, shouldBeOn;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.mgmt.getLightSchedule()];
                        case 1:
                            cfg = _a.sent();
                            if (!cfg.enabled)
                                return [2 /*return*/];
                            shouldBeOn = this.inWindow(currHHMM, cfg.onTime, cfg.offTime);
                            if (this.lastLedState === shouldBeOn)
                                return [2 /*return*/]; // no state change
                            this.lastLedState = shouldBeOn;
                            this.logger.log("Light schedule \u2192 LED ".concat(shouldBeOn ? 'ON' : 'OFF', " (brightness ").concat(cfg.brightness, ", ").concat(cfg.color, ")"));
                            return [4 /*yield*/, this.actuators.triggerActuator({
                                    actuatorId: 3, type: 'LED_STRIP', relayChannel: 3, state: shouldBeOn, source: 'CRON',
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /** Window check supporting overnight ranges (e.g. 22:00–06:00). */
        SchedulerService_1.prototype.inWindow = function (curr, start, end) {
            if (start === end)
                return false;
            if (start < end)
                return curr >= start && curr < end;
            return curr >= start || curr < end; // overnight
        };
        // ── Emergency ─────────────────────────────────────────────────────────────
        SchedulerService_1.prototype.checkEmergency = function () {
            return __awaiter(this, void 0, void 0, function () {
                var cfg, readings, get, temp, ph, do2, issues;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.mgmt.getTankConfig()];
                        case 1:
                            cfg = _a.sent();
                            return [4 /*yield*/, this.sensors.getLatest()];
                        case 2:
                            readings = _a.sent();
                            get = function (t) { return readings.find(function (r) { return r.type === t; }); };
                            temp = get('temp_c');
                            ph = get('pH');
                            do2 = get('do_mg_l');
                            issues = [];
                            if (temp && (temp.value > cfg.emergencyTempMax || temp.value < cfg.emergencyTempMin))
                                issues.push("temp ".concat(temp.value, "\u00B0C outside [").concat(cfg.emergencyTempMin, ", ").concat(cfg.emergencyTempMax, "]"));
                            if (ph && (ph.value > cfg.emergencyPhMax || ph.value < cfg.emergencyPhMin))
                                issues.push("pH ".concat(ph.value, " outside [").concat(cfg.emergencyPhMin, ", ").concat(cfg.emergencyPhMax, "]"));
                            if (do2 && do2.value < cfg.emergencyDoMin)
                                issues.push("DO ".concat(do2.value, " mg/L below ").concat(cfg.emergencyDoMin));
                            if (!issues.length)
                                return [2 /*return*/];
                            return [4 /*yield*/, this.alerts.createAlert({
                                    sensorId: 0,
                                    tankId: 1,
                                    type: 'EMERGENCY',
                                    severity: 'CRITICAL',
                                    message: "Emergency: ".concat(issues.join('; ')),
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        // ── Cleaning reminder ─────────────────────────────────────────────────────
        SchedulerService_1.prototype.checkCleaningReminder = function (now) {
            return __awaiter(this, void 0, void 0, function () {
                var cfg, ageMs, dueMs, overdueDays;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (now.getHours() === this.lastCleanCheckHour)
                                return [2 /*return*/];
                            this.lastCleanCheckHour = now.getHours();
                            return [4 /*yield*/, this.mgmt.getTankConfig()];
                        case 1:
                            cfg = _a.sent();
                            if (!cfg.lastCleanedAt)
                                return [2 /*return*/]; // never cleaned, don't spam — wait until user marks first time
                            ageMs = now.getTime() - new Date(cfg.lastCleanedAt).getTime();
                            dueMs = cfg.cleaningIntervalDays * 24 * 60 * 60 * 1000;
                            if (ageMs < dueMs)
                                return [2 /*return*/];
                            overdueDays = Math.floor((ageMs - dueMs) / (24 * 60 * 60 * 1000));
                            return [4 /*yield*/, this.alerts.createAlert({
                                    sensorId: 0,
                                    tankId: 1,
                                    type: 'MAINTENANCE',
                                    severity: 'WARNING',
                                    message: "Cleaning reminder: tank cleaning is overdue by ".concat(overdueDays, " day(s)."),
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return SchedulerService_1;
    }());
    __setFunctionName(_classThis, "SchedulerService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SchedulerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SchedulerService = _classThis;
}();
exports.SchedulerService = SchedulerService;
