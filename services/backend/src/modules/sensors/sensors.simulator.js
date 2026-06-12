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
exports.SensorsSimulator = void 0;
var common_1 = require("@nestjs/common");
/**
 * Demo sensor simulator.
 * Pushes realistic readings for all 4 sensor types every 8s so getLatest()
 * always returns a complete set (pH, temp_c, do_mg_l, CO2). Disabled when
 * SIMULATE_SENSORS=false. Real serial bridge readings still take precedence
 * because they're saved through the same path.
 */
var SensorsSimulator = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SensorsSimulator = _classThis = /** @class */ (function () {
        function SensorsSimulator_1(sensors, config) {
            this.sensors = sensors;
            this.config = config;
            this.logger = new common_1.Logger(SensorsSimulator.name);
            this.timer = null;
            // Drifting baselines for natural variation
            this.state = { pH: 6.95, temp_c: 26.4, do_mg_l: 7.4, CO2: 18 };
        }
        SensorsSimulator_1.prototype.onModuleInit = function () {
            var _this = this;
            var _a;
            var enabled = ((_a = this.config.get('SIMULATE_SENSORS')) !== null && _a !== void 0 ? _a : 'true') !== 'false';
            if (!enabled)
                return;
            this.logger.log('Sensor simulator enabled (every 8s) — set SIMULATE_SENSORS=false to disable');
            // Seed immediately so /sensors/latest is populated before first request.
            this.tick();
            this.timer = setInterval(function () { return _this.tick(); }, 8000);
        };
        SensorsSimulator_1.prototype.onModuleDestroy = function () {
            if (this.timer)
                clearInterval(this.timer);
        };
        SensorsSimulator_1.prototype.drift = function (curr, min, max, step) {
            var next = curr + (Math.random() - 0.5) * step;
            return Math.max(min, Math.min(max, next));
        };
        SensorsSimulator_1.prototype.tick = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now, readings, _i, readings_1, r, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.state.pH = this.drift(this.state.pH, 6.7, 7.4, 0.06);
                            this.state.temp_c = this.drift(this.state.temp_c, 24.5, 27.8, 0.18);
                            this.state.do_mg_l = this.drift(this.state.do_mg_l, 6.2, 8.4, 0.15);
                            this.state.CO2 = this.drift(this.state.CO2, 12, 32, 1.2);
                            now = new Date();
                            readings = [
                                { sensorId: 1, type: 'pH', value: +this.state.pH.toFixed(2), unit: 'pH' },
                                { sensorId: 2, type: 'temp_c', value: +this.state.temp_c.toFixed(1), unit: '°C' },
                                { sensorId: 3, type: 'do_mg_l', value: +this.state.do_mg_l.toFixed(2), unit: 'mg/L' },
                                { sensorId: 4, type: 'CO2', value: Math.round(this.state.CO2), unit: 'ppm' },
                            ];
                            _i = 0, readings_1 = readings;
                            _a.label = 1;
                        case 1:
                            if (!(_i < readings_1.length)) return [3 /*break*/, 6];
                            r = readings_1[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.sensors.saveReading(__assign(__assign({}, r), { timestamp: now }))];
                        case 3:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            e_1 = _a.sent();
                            this.logger.warn("simulator save failed for ".concat(r.type, ": ").concat(e_1.message));
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        return SensorsSimulator_1;
    }());
    __setFunctionName(_classThis, "SensorsSimulator");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SensorsSimulator = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SensorsSimulator = _classThis;
}();
exports.SensorsSimulator = SensorsSimulator;
