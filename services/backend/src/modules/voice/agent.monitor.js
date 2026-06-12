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
exports.AgentMonitorService = void 0;
var common_1 = require("@nestjs/common");
var CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
var SAFE_RANGES = {
    pH: { min: 6.8, max: 7.5 },
    temp_c: { min: 24, max: 28 },
    do_mg_l: { min: 6, max: 9 },
    CO2: { min: 0, max: 40 },
};
var AgentMonitorService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AgentMonitorService = _classThis = /** @class */ (function () {
        function AgentMonitorService_1(sensors, management, agent, push) {
            this.sensors = sensors;
            this.management = management;
            this.agent = agent;
            this.push = push;
            this.logger = new common_1.Logger(AgentMonitorService.name);
            this.timer = null;
        }
        AgentMonitorService_1.prototype.onModuleInit = function () {
            var _this = this;
            // Stagger first check by 30s so backend fully starts before agent fires
            setTimeout(function () { return _this.check(); }, 30000);
            this.timer = setInterval(function () { return _this.check(); }, CHECK_INTERVAL_MS);
            this.logger.log('Agent monitor started — checking every 5 minutes');
        };
        AgentMonitorService_1.prototype.onModuleDestroy = function () {
            if (this.timer)
                clearInterval(this.timer);
        };
        AgentMonitorService_1.prototype.check = function () {
            return __awaiter(this, void 0, void 0, function () {
                var config, readings, issues, prompt_1, result, pendingAction, exec, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 10, , 11]);
                            return [4 /*yield*/, this.management.getTankConfig()];
                        case 1:
                            config = _a.sent();
                            if (!config.agentMonitorEnabled)
                                return [2 /*return*/];
                            return [4 /*yield*/, this.sensors.getLatest()];
                        case 2:
                            readings = _a.sent();
                            if (!readings.length)
                                return [2 /*return*/];
                            issues = this.detectIssues(readings);
                            if (!issues.length) {
                                this.logger.debug('Monitor check: all sensors OK');
                                return [2 /*return*/];
                            }
                            this.logger.log("Monitor detected issues: ".concat(issues.join(', ')));
                            prompt_1 = "You are monitoring the tank in the background. Detected: ".concat(issues.join('; '), ". Analyze and recommend the best corrective action.");
                            return [4 /*yield*/, this.agent.run(prompt_1)];
                        case 3:
                            result = _a.sent();
                            if (!result.pendingAction) {
                                this.logger.log("Agent assessment: ".concat(result.response));
                                return [2 /*return*/];
                            }
                            pendingAction = result.pendingAction;
                            this.logger.log("Agent proposes: ".concat(pendingAction.tool, " \u2014 ").concat(pendingAction.reason));
                            if (!(config.agentMode === 'auto')) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.agent.executeConfirmedAction(pendingAction.tool, pendingAction.args)];
                        case 4:
                            exec = _a.sent();
                            this.logger.log("Auto-executed ".concat(pendingAction.tool, ": ").concat(exec.message));
                            if (!config.pushEnabled) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.push.send(config.pushToken, '🤖 Veronica acted', exec.message)];
                        case 5:
                            _a.sent();
                            _a.label = 6;
                        case 6: return [3 /*break*/, 9];
                        case 7:
                            this.logger.log("Confirm mode \u2014 proposing: \"".concat(result.response, "\""));
                            if (!config.pushEnabled) return [3 /*break*/, 9];
                            return [4 /*yield*/, this.push.send(config.pushToken, '🐟 Veronica suggests', result.response)];
                        case 8:
                            _a.sent();
                            _a.label = 9;
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            err_1 = _a.sent();
                            this.logger.error("Monitor check failed: ".concat(err_1.message));
                            return [3 /*break*/, 11];
                        case 11: return [2 /*return*/];
                    }
                });
            });
        };
        AgentMonitorService_1.prototype.detectIssues = function (readings) {
            var issues = [];
            for (var _i = 0, readings_1 = readings; _i < readings_1.length; _i++) {
                var r = readings_1[_i];
                var range = SAFE_RANGES[r.type];
                if (!range)
                    continue;
                var v = Number(r.value);
                if (v < range.min)
                    issues.push("".concat(r.type, " low (").concat(v.toFixed(2), ", min ").concat(range.min, ")"));
                else if (v > range.max)
                    issues.push("".concat(r.type, " high (").concat(v.toFixed(2), ", max ").concat(range.max, ")"));
            }
            return issues;
        };
        return AgentMonitorService_1;
    }());
    __setFunctionName(_classThis, "AgentMonitorService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgentMonitorService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgentMonitorService = _classThis;
}();
exports.AgentMonitorService = AgentMonitorService;
