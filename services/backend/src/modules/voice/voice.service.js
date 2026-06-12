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
exports.VoiceService = void 0;
var common_1 = require("@nestjs/common");
var rxjs_1 = require("rxjs");
var VoiceService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var VoiceService = _classThis = /** @class */ (function () {
        function VoiceService_1(http, config, sensors, actuators, sessionRepo) {
            var _a, _b, _c, _d, _e, _f;
            this.http = http;
            this.config = config;
            this.sensors = sensors;
            this.actuators = actuators;
            this.sessionRepo = sessionRepo;
            this.logger = new common_1.Logger(VoiceService.name);
            this.predictorUrl =
                (_a = this.config.get('AI_PREDICTOR_URL')) !== null && _a !== void 0 ? _a : 'http://localhost:8000';
            this.ollamaUrl = (_b = this.config.get('OLLAMA_URL')) !== null && _b !== void 0 ? _b : 'http://localhost:11434';
            this.openRouterUrl =
                (_c = this.config.get('OPENROUTER_BASE_URL')) !== null && _c !== void 0 ? _c : 'https://openrouter.ai/api/v1';
            this.openRouterKey = (_d = this.config.get('OPENROUTER_API_KEY')) !== null && _d !== void 0 ? _d : '';
            this.model =
                (_f = (_e = this.config.get('OPENROUTER_MODEL')) !== null && _e !== void 0 ? _e : this.config.get('OLLAMA_MODEL')) !== null && _f !== void 0 ? _f : 'deepseek/deepseek-chat-v3.1';
            this.llmProvider = this.openRouterKey ? 'openrouter' : 'ollama';
        }
        VoiceService_1.prototype.handleQuery = function (text, snapshotId) {
            return __awaiter(this, void 0, void 0, function () {
                var latestReadings, actuatorResponse, actuatorState, cleanText, sensorContext, qualityResult, systemPrompt, t0, aiResponse, durationMs, session, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Processing voice query: \"".concat(text, "\""));
                            return [4 /*yield*/, this.sensors.getLatest()];
                        case 1:
                            latestReadings = _a.sent();
                            return [4 /*yield*/, this.actuators.getState()];
                        case 2:
                            actuatorResponse = (_a.sent());
                            actuatorState = (actuatorResponse === null || actuatorResponse === void 0 ? void 0 : actuatorResponse.actuators) || {
                                pump: false,
                                led: false,
                                feeder: false,
                            };
                            cleanText = text
                                .replace(/^\[Live tank[^\]]*\]\s*User:\s*/i, '')
                                .trim();
                            sensorContext = this.buildSensorContext(latestReadings);
                            return [4 /*yield*/, this.fetchQualityScore(latestReadings)];
                        case 3:
                            qualityResult = _a.sent();
                            systemPrompt = this.buildSystemPrompt(sensorContext, qualityResult, actuatorState);
                            _a.label = 4;
                        case 4:
                            _a.trys.push([4, 7, , 8]);
                            t0 = Date.now();
                            return [4 /*yield*/, this.chat([
                                    { role: 'system', content: systemPrompt },
                                    { role: 'user', content: cleanText },
                                ])];
                        case 5:
                            aiResponse = _a.sent();
                            durationMs = Date.now() - t0;
                            session = this.sessionRepo.create({
                                transcribedText: cleanText,
                                aiResponse: aiResponse,
                                snapshotId: snapshotId,
                                wakeWordAt: new Date(),
                                durationMs: durationMs,
                            });
                            return [4 /*yield*/, this.sessionRepo.save(session)];
                        case 6:
                            _a.sent();
                            return [2 /*return*/, { response: aiResponse, aiOffline: false }];
                        case 7:
                            error_1 = _a.sent();
                            this.logger.error("".concat(this.llmProvider, " error: ").concat(error_1.message));
                            return [2 /*return*/, {
                                    response: this.sensorFallback(cleanText, latestReadings, qualityResult),
                                    aiOffline: true,
                                }];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        VoiceService_1.prototype.fetchQualityScore = function (readings) {
            return __awaiter(this, void 0, void 0, function () {
                var get, pH, temp, do2, res, _a;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _d.trys.push([0, 2, , 3]);
                            get = function (type) {
                                return readings.find(function (r) { var _a; return ((_a = r.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === type.toLowerCase(); });
                            };
                            pH = get('pH');
                            temp = (_b = get('TEMP')) !== null && _b !== void 0 ? _b : get('temp_c');
                            do2 = (_c = get('DO2')) !== null && _c !== void 0 ? _c : get('do_mg_l');
                            if (!pH || !temp || !do2)
                                return [2 /*return*/, null];
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.http.post("".concat(this.predictorUrl, "/predict/quality"), {
                                    pH: parseFloat(pH.value),
                                    temp_c: parseFloat(temp.value),
                                    do_mg_l: parseFloat(do2.value),
                                }))];
                        case 1:
                            res = _d.sent();
                            return [2 /*return*/, res.data];
                        case 2:
                            _a = _d.sent();
                            return [2 /*return*/, null];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        VoiceService_1.prototype.buildSensorContext = function (readings) {
            if (!readings.length)
                return 'No sensor data available.';
            return readings
                .filter(function (r) { var _a; return ((_a = r.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== 'co2'; })
                .map(function (r) { var _a; return "".concat(r.type, ": ").concat(r.value).concat(r.unit, " (").concat((_a = r.status) !== null && _a !== void 0 ? _a : 'unknown', ")"); })
                .join(', ');
        };
        VoiceService_1.prototype.buildSystemPrompt = function (sensorContext, quality, actuatorState) {
            var qualityLine = quality
                ? "ML Quality Score: ".concat(quality.score, "/100, status ").concat(quality.status, ".")
                : 'ML Quality Model: offline.';
            return [
                'You are Veronica, the AI assistant for Fishlinic.',
                'Ground every answer in the live tank data below.',
                'Be concise: 1-3 sentences, English only.',
                'If a value is missing, say it is missing instead of guessing.',
                'Safe ranges: pH 6.8-7.5, Temperature 24-28C, Dissolved O2 6-9 mg/L.',
                "Sensor readings: ".concat(sensorContext),
                "Actuators: pump ".concat(actuatorState.pump ? 'ON' : 'OFF', ", LED ").concat(actuatorState.led ? 'ON' : 'OFF', "."),
                qualityLine,
            ].join('\n');
        };
        VoiceService_1.prototype.sensorFallback = function (question, readings, quality) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            var get = function (type) {
                return readings.find(function (r) { var _a; return ((_a = r.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === type.toLowerCase(); });
            };
            var pH = get('pH');
            var temp = (_a = get('TEMP')) !== null && _a !== void 0 ? _a : get('temp_c');
            var do2 = (_b = get('DO2')) !== null && _b !== void 0 ? _b : get('do_mg_l');
            if (!readings.length) {
                return "I can't reach the sensors right now. Please check that the serial bridge is running and connected to the backend.";
            }
            var q = question.toLowerCase();
            if (/ph|acid|alkaline/.test(q)) {
                return pH
                    ? "Current pH is ".concat(pH.value, ". ").concat(pH.status === 'ok' ? 'It is within the safe range.' : "Status is ".concat(pH.status, "."))
                    : "I can read the sensors but pH data isn't available yet.";
            }
            if (/temp|hot|cold|warm/.test(q)) {
                return temp
                    ? "Water temperature is ".concat(temp.value, "C. ").concat(temp.status === 'ok' ? 'It is in the safe range.' : "Status is ".concat(temp.status, "."))
                    : 'Temperature sensor data is not available yet.';
            }
            if (/oxygen|o2|do|dissolv/.test(q)) {
                return do2
                    ? "Dissolved oxygen is ".concat(do2.value, " mg/L. ").concat(do2.status === 'ok' ? 'That is a safe level.' : "Status is ".concat(do2.status, "."))
                    : 'Dissolved oxygen data is not available yet.';
            }
            if (/qualit|score|health|safe|status|ok|fine|good|all/.test(q)) {
                if (quality) {
                    return "The water quality model scores the tank at ".concat(quality.score, "/100 (").concat(quality.status, "). pH ").concat((_c = pH === null || pH === void 0 ? void 0 : pH.value) !== null && _c !== void 0 ? _c : '-', ", temp ").concat((_d = temp === null || temp === void 0 ? void 0 : temp.value) !== null && _d !== void 0 ? _d : '-', "C, O2 ").concat((_e = do2 === null || do2 === void 0 ? void 0 : do2.value) !== null && _e !== void 0 ? _e : '-', " mg/L.");
                }
                var issues = [pH, temp, do2].filter(function (s) { return s && s.status !== 'ok'; });
                if (issues.length === 0) {
                    return "All live sensors look good. pH ".concat((_f = pH === null || pH === void 0 ? void 0 : pH.value) !== null && _f !== void 0 ? _f : '-', ", temp ").concat((_g = temp === null || temp === void 0 ? void 0 : temp.value) !== null && _g !== void 0 ? _g : '-', "C, O2 ").concat((_h = do2 === null || do2 === void 0 ? void 0 : do2.value) !== null && _h !== void 0 ? _h : '-', " mg/L.");
                }
                return "I see ".concat(issues.length, " issue(s): ").concat(issues.map(function (s) { return "".concat(s.type, " is ").concat(s.status); }).join(', '), ".");
            }
            var summary = [
                pH ? "pH ".concat(pH.value) : null,
                temp ? "".concat(temp.value, "C") : null,
                do2 ? "O2 ".concat(do2.value, " mg/L") : null,
                quality ? "quality ".concat(quality.score, "/100") : null,
            ]
                .filter(Boolean)
                .join(', ');
            return "Live tank data (".concat(summary, "). Veronica AI is offline right now, but the sensors are still reporting live values.");
        };
        VoiceService_1.prototype.chat = function (messages) {
            return __awaiter(this, void 0, void 0, function () {
                var res_1, res;
                var _a, _b, _c, _d, _e, _f, _g, _h;
                return __generator(this, function (_j) {
                    switch (_j.label) {
                        case 0:
                            if (!(this.llmProvider === 'openrouter')) return [3 /*break*/, 2];
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.http.post("".concat(this.openRouterUrl, "/chat/completions"), {
                                    model: this.model,
                                    messages: messages,
                                }, {
                                    headers: this.buildOpenRouterHeaders(),
                                }))];
                        case 1:
                            res_1 = _j.sent();
                            return [2 /*return*/, (((_e = (_d = (_c = (_b = (_a = res_1.data) === null || _a === void 0 ? void 0 : _a.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.trim()) ||
                                    'Sorry, I could not process that right now.')];
                        case 2: return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.http.post("".concat(this.ollamaUrl, "/api/chat"), {
                                model: this.model,
                                messages: messages,
                                stream: false,
                            }))];
                        case 3:
                            res = _j.sent();
                            return [2 /*return*/, (((_h = (_g = (_f = res.data) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.content) === null || _h === void 0 ? void 0 : _h.trim()) ||
                                    'Sorry, I could not process that right now.')];
                    }
                });
            });
        };
        VoiceService_1.prototype.buildOpenRouterHeaders = function () {
            return {
                Authorization: "Bearer ".concat(this.openRouterKey),
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://fishlinic.local',
                'X-Title': 'Fishlinic',
            };
        };
        VoiceService_1.prototype.getSessions = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.sessionRepo.find({
                                order: { createdAt: 'DESC' },
                                take: 20,
                            })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        return VoiceService_1;
    }());
    __setFunctionName(_classThis, "VoiceService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VoiceService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VoiceService = _classThis;
}();
exports.VoiceService = VoiceService;
