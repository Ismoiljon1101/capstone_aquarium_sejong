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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIRMATION_TOOLS = exports.AGENT_TOOLS = void 0;
exports.executeTool = executeTool;
exports.AGENT_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'readSensors',
            description: 'Read the current live sensor values from the tank (pH, temperature, dissolved oxygen, CO2). Call this first before any reasoning or recommendation.',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'readHistory',
            description: 'Read sensor history for the last hour to detect trends (rising, dropping, stable).',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'readBehaviorAnalysis',
            description: 'Capture a fresh live video clip from the tank camera and run fish behavior analysis immediately. Use this for fish behavior, movement, activity level, stress, feeding response, counting fish, or visual fish health questions.',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'getActuatorState',
            description: 'Get the current on/off state of all actuators (pump, LED, feeder).',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'readDiagnoses',
            description: 'Read the latest fish disease diagnoses from the ML vision model. Use this when the user asks about fish health, disease, or appearance.',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'readThresholds',
            description: 'Read the safe parameter ranges configured for this tank (pH, temperature, DO, CO2 min/max).',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'controlPump',
            description: 'Turn the air pump ON or OFF. Requires user confirmation, do not call unless you have a clear sensor-based reason.',
            parameters: {
                type: 'object',
                properties: {
                    state: { type: 'boolean', description: 'true = ON, false = OFF' },
                    reason: { type: 'string', description: 'One sentence explaining why this is needed based on sensor data.' },
                },
                required: ['state', 'reason'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'controlLed',
            description: 'Turn the LED strip ON or OFF. Requires user confirmation, do not call unless you have a clear reason.',
            parameters: {
                type: 'object',
                properties: {
                    state: { type: 'boolean', description: 'true = ON, false = OFF' },
                    reason: { type: 'string', description: 'One sentence explaining why.' },
                },
                required: ['state', 'reason'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'triggerFeed',
            description: 'Trigger the automatic feeder for 1-5 cycles. Requires user confirmation.',
            parameters: {
                type: 'object',
                properties: {
                    cycles: { type: 'number', description: 'Number of feed cycles (1-5). Default 2.' },
                    reason: { type: 'string', description: 'One sentence explaining why feeding is needed now.' },
                },
                required: ['cycles', 'reason'],
            },
        },
    },
];
exports.CONFIRMATION_TOOLS = new Set(['controlPump', 'controlLed', 'triggerFeed']);
function executeTool(name, args, deps) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, readings, history_2, byType, _i, history_1, r, summary, result, behavior, disease, count, quality, state, diagnoses, thresholds, err_1;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        return __generator(this, function (_q) {
            switch (_q.label) {
                case 0:
                    _q.trys.push([0, 16, , 17]);
                    _a = name;
                    switch (_a) {
                        case 'readSensors': return [3 /*break*/, 1];
                        case 'readHistory': return [3 /*break*/, 3];
                        case 'readBehaviorAnalysis': return [3 /*break*/, 5];
                        case 'getActuatorState': return [3 /*break*/, 7];
                        case 'readDiagnoses': return [3 /*break*/, 9];
                        case 'readThresholds': return [3 /*break*/, 11];
                        case 'controlPump': return [3 /*break*/, 13];
                        case 'controlLed': return [3 /*break*/, 13];
                        case 'triggerFeed': return [3 /*break*/, 13];
                    }
                    return [3 /*break*/, 14];
                case 1: return [4 /*yield*/, deps.getSensorReadings()];
                case 2:
                    readings = _q.sent();
                    if (!readings.length)
                        return [2 /*return*/, 'No sensor data available right now.'];
                    return [2 /*return*/, readings
                            .map(function (r) { return "".concat(r.type, ": ").concat(r.value).concat(r.unit, " [").concat(r.status, "]"); })
                            .join(', ')];
                case 3: return [4 /*yield*/, deps.getSensorHistory()];
                case 4:
                    history_2 = _q.sent();
                    if (!history_2.length)
                        return [2 /*return*/, 'No history data available for the last hour.'];
                    byType = new Map();
                    for (_i = 0, history_1 = history_2; _i < history_1.length; _i++) {
                        r = history_1[_i];
                        if (!byType.has(r.type))
                            byType.set(r.type, []);
                        byType.get(r.type).push(r.value);
                    }
                    summary = __spreadArray([], byType.entries(), true).map(function (_a) {
                        var type = _a[0], vals = _a[1];
                        var latest = vals.slice(-1)[0];
                        var oldest = vals[0];
                        var trend = latest > oldest + 0.1 ? 'rising' : latest < oldest - 0.1 ? 'dropping' : 'stable';
                        return "".concat(type, ": ").concat(trend, " (was ").concat(oldest.toFixed(2), ", now ").concat(latest.toFixed(2), ", ").concat(vals.length, " readings)");
                    });
                    return [2 /*return*/, summary.join(' | ')];
                case 5: return [4 /*yield*/, deps.runBehaviorAnalysis()];
                case 6:
                    result = _q.sent();
                    behavior = (_b = result.behavior) !== null && _b !== void 0 ? _b : {};
                    disease = (_c = result.disease) !== null && _c !== void 0 ? _c : {};
                    count = (_d = result.count) !== null && _d !== void 0 ? _d : {};
                    quality = (_e = result.quality) !== null && _e !== void 0 ? _e : {};
                    return [2 /*return*/, [
                            "behavior=".concat((_g = (_f = behavior['label']) !== null && _f !== void 0 ? _f : behavior['status']) !== null && _g !== void 0 ? _g : 'unknown', " (").concat((_h = behavior['confidence']) !== null && _h !== void 0 ? _h : 'n/a', ")"),
                            "behavior_status=".concat((_j = behavior['status']) !== null && _j !== void 0 ? _j : 'unknown'),
                            "disease=".concat((_k = disease['disease']) !== null && _k !== void 0 ? _k : 'unknown', " (").concat((_l = disease['confidence']) !== null && _l !== void 0 ? _l : 'n/a', ")"),
                            "fish_count=".concat((_m = count['count']) !== null && _m !== void 0 ? _m : 'unknown'),
                            "water_quality=".concat((_p = (_o = quality['label']) !== null && _o !== void 0 ? _o : quality['status']) !== null && _p !== void 0 ? _p : 'unknown'),
                            result.reportId ? "report_id=".concat(result.reportId) : '',
                        ].filter(Boolean).join(' | ')];
                case 7: return [4 /*yield*/, deps.getActuatorState()];
                case 8:
                    state = _q.sent();
                    return [2 /*return*/, JSON.stringify(state)];
                case 9: return [4 /*yield*/, deps.getDiagnoses()];
                case 10:
                    diagnoses = _q.sent();
                    if (!diagnoses.length)
                        return [2 /*return*/, 'No fish diagnoses on record yet.'];
                    return [2 /*return*/, diagnoses
                            .slice(0, 5)
                            .map(function (d) { return "".concat(d.diseaseClass, " (").concat(d.severity, ", ").concat((d.mlConfidence * 100).toFixed(1), "% confidence) - ").concat(new Date(d.timestamp).toLocaleString()); })
                            .join(' | ')];
                case 11: return [4 /*yield*/, deps.getThresholds()];
                case 12:
                    thresholds = _q.sent();
                    return [2 /*return*/, JSON.stringify(thresholds)];
                case 13: return [2 /*return*/, "[CONFIRMATION_REQUIRED] ".concat(name, " with args ").concat(JSON.stringify(args))];
                case 14: return [2 /*return*/, "Unknown tool: ".concat(name)];
                case 15: return [3 /*break*/, 17];
                case 16:
                    err_1 = _q.sent();
                    return [2 /*return*/, "Tool error: ".concat(err_1.message)];
                case 17: return [2 /*return*/];
            }
        });
    });
}
