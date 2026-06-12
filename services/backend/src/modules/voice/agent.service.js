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
exports.AgentService = void 0;
var common_1 = require("@nestjs/common");
var rxjs_1 = require("rxjs");
var agent_tools_1 = require("./agent.tools");
var MAX_ITERATIONS = 6;
var SYSTEM_PROMPT = "You are Veronica, an autonomous AI agent managing a smart aquarium at Sejong University.\n\nYou have tools to READ sensor data, RUN fresh camera analysis, and CONTROL hardware actuators.\n\nRULES:\n1. Always call readSensors first before any answer or recommendation.\n2. If the user asks about trends, call readHistory as well.\n3. If the user asks about fish behavior, movement, activity, stress, feeding response, fish count, or visual fish health, call readBehaviorAnalysis after readSensors.\n4. CONTROL RULES:\n   - If the USER explicitly asks you to turn something on/off or trigger feeding, call the tool immediately.\n   - If YOU decide to act autonomously, only act when sensor or fresh vision data justifies it.\n   - For user commands use reason=\"User requested.\"\n5. Be concise: 1-2 sentences max in the final response. Never ask for confirmation because the system handles that.\n6. Safe parameter ranges: pH 6.8-7.5 | Temp 24-28C | DO 6-9 mg/L.\n7. If all sensors are within safe range, say so. If any are outside, flag it and propose a corrective action.";
var AgentService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AgentService = _classThis = /** @class */ (function () {
        function AgentService_1(http, config, sensors, actuators, management, fish, vision, chatRepo) {
            var _a, _b, _c, _d, _e;
            this.http = http;
            this.config = config;
            this.sensors = sensors;
            this.actuators = actuators;
            this.management = management;
            this.fish = fish;
            this.vision = vision;
            this.chatRepo = chatRepo;
            this.logger = new common_1.Logger(AgentService.name);
            this.ollamaUrl = (_a = this.config.get('OLLAMA_URL')) !== null && _a !== void 0 ? _a : 'http://localhost:11434';
            this.openRouterUrl =
                (_b = this.config.get('OPENROUTER_BASE_URL')) !== null && _b !== void 0 ? _b : 'https://openrouter.ai/api/v1';
            this.openRouterKey = (_c = this.config.get('OPENROUTER_API_KEY')) !== null && _c !== void 0 ? _c : '';
            this.model =
                (_e = (_d = this.config.get('OPENROUTER_MODEL')) !== null && _d !== void 0 ? _d : this.config.get('OLLAMA_MODEL')) !== null && _e !== void 0 ? _e : 'deepseek/deepseek-chat-v3.1';
            this.llmProvider = this.openRouterKey ? 'openrouter' : 'ollama';
        }
        AgentService_1.prototype.run = function (userMessage, sessionId) {
            return __awaiter(this, void 0, void 0, function () {
                var history, _a, messages, deps, iterations, finalize, res, msg, _i, _b, tc, name_1, args, reason, config, autoMode, exec, pendingAction, result, err_1, fallback, _c;
                var _this = this;
                var _d, _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            if (!sessionId) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.loadHistory(sessionId)];
                        case 1:
                            _a = _g.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _a = [];
                            _g.label = 3;
                        case 3:
                            history = _a;
                            messages = __spreadArray(__spreadArray([
                                { role: 'system', content: SYSTEM_PROMPT }
                            ], history, true), [
                                { role: 'user', content: userMessage },
                            ], false);
                            deps = this.buildDeps();
                            iterations = 0;
                            finalize = function (response_1) {
                                var args_1 = [];
                                for (var _i = 1; _i < arguments.length; _i++) {
                                    args_1[_i - 1] = arguments[_i];
                                }
                                return __awaiter(_this, __spreadArray([response_1], args_1, true), void 0, function (response, extra) {
                                    var e_1;
                                    if (extra === void 0) { extra = {}; }
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!sessionId) return [3 /*break*/, 4];
                                                _a.label = 1;
                                            case 1:
                                                _a.trys.push([1, 3, , 4]);
                                                return [4 /*yield*/, this.saveMessages(sessionId, userMessage, response)];
                                            case 2:
                                                _a.sent();
                                                return [3 /*break*/, 4];
                                            case 3:
                                                e_1 = _a.sent();
                                                this.logger.warn("saveMessages failed: ".concat(e_1.message));
                                                return [3 /*break*/, 4];
                                            case 4: return [2 /*return*/, __assign({ response: response, aiOffline: false }, extra)];
                                        }
                                    });
                                });
                            };
                            _g.label = 4;
                        case 4:
                            _g.trys.push([4, 20, , 25]);
                            _g.label = 5;
                        case 5:
                            if (!(iterations < MAX_ITERATIONS)) return [3 /*break*/, 18];
                            iterations++;
                            return [4 /*yield*/, this.callModel(messages)];
                        case 6:
                            res = _g.sent();
                            msg = res.message;
                            if (!(!msg.tool_calls || msg.tool_calls.length === 0)) return [3 /*break*/, 8];
                            return [4 /*yield*/, finalize(msg.content || 'Done.')];
                        case 7: return [2 /*return*/, _g.sent()];
                        case 8:
                            messages.push({
                                role: 'assistant',
                                content: (_d = msg.content) !== null && _d !== void 0 ? _d : '',
                                tool_calls: msg.tool_calls,
                            });
                            _i = 0, _b = msg.tool_calls;
                            _g.label = 9;
                        case 9:
                            if (!(_i < _b.length)) return [3 /*break*/, 17];
                            tc = _b[_i];
                            name_1 = tc.function.name;
                            args = (_e = tc.function.arguments) !== null && _e !== void 0 ? _e : {};
                            if (!agent_tools_1.CONFIRMATION_TOOLS.has(name_1)) return [3 /*break*/, 14];
                            reason = (_f = args.reason) !== null && _f !== void 0 ? _f : "".concat(name_1, " requested by agent");
                            return [4 /*yield*/, this.management.getTankConfig()];
                        case 10:
                            config = _g.sent();
                            autoMode = config.agentMode === 'auto';
                            this.logger.log("Agent proposes: ".concat(name_1, " - ").concat(reason, " (mode: ").concat(config.agentMode, ")"));
                            if (!autoMode) return [3 /*break*/, 12];
                            return [4 /*yield*/, this.executeConfirmedAction(name_1, args)];
                        case 11:
                            exec = _g.sent();
                            messages.push({
                                role: 'tool',
                                content: exec.message,
                                tool_call_id: tc.id,
                            });
                            this.logger.log("Auto-executed ".concat(name_1, ": ").concat(exec.message));
                            return [3 /*break*/, 16];
                        case 12:
                            pendingAction = { tool: name_1, args: args, reason: reason };
                            return [4 /*yield*/, finalize(this.summarizeProposal(pendingAction), {
                                    pendingAction: pendingAction,
                                })];
                        case 13: return [2 /*return*/, _g.sent()];
                        case 14: return [4 /*yield*/, (0, agent_tools_1.executeTool)(name_1, args, deps)];
                        case 15:
                            result = _g.sent();
                            this.logger.debug("Tool ".concat(name_1, " -> ").concat(result.slice(0, 120)));
                            messages.push({ role: 'tool', content: result, tool_call_id: tc.id });
                            _g.label = 16;
                        case 16:
                            _i++;
                            return [3 /*break*/, 9];
                        case 17: return [3 /*break*/, 5];
                        case 18: return [4 /*yield*/, finalize('I reached my reasoning limit. Please try a more specific question.')];
                        case 19: return [2 /*return*/, _g.sent()];
                        case 20:
                            err_1 = _g.sent();
                            this.logger.error("Agent error: ".concat(err_1.message));
                            fallback = 'Veronica is offline right now. Please check the configured AI provider.';
                            if (!sessionId) return [3 /*break*/, 24];
                            _g.label = 21;
                        case 21:
                            _g.trys.push([21, 23, , 24]);
                            return [4 /*yield*/, this.saveMessages(sessionId, userMessage, fallback)];
                        case 22:
                            _g.sent();
                            return [3 /*break*/, 24];
                        case 23:
                            _c = _g.sent();
                            return [3 /*break*/, 24];
                        case 24: return [2 /*return*/, { response: fallback, aiOffline: true }];
                        case 25: return [2 /*return*/];
                    }
                });
            });
        };
        AgentService_1.prototype.executeConfirmedAction = function (tool, args, sessionId) {
            return __awaiter(this, void 0, void 0, function () {
                var state, cycles, err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 7, , 8]);
                            state = Boolean(args.state);
                            if (!(tool === 'controlPump')) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.actuators.triggerActuator({
                                    actuatorId: 2,
                                    type: 'AIR_PUMP',
                                    relayChannel: 2,
                                    state: state,
                                    source: 'AGENT',
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.finishAction(sessionId, {
                                    success: true,
                                    message: "Pump turned ".concat(state ? 'ON' : 'OFF', "."),
                                })];
                        case 2:
                            if (!(tool === 'controlLed')) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.actuators.triggerActuator({
                                    actuatorId: 3,
                                    type: 'LED_STRIP',
                                    relayChannel: 3,
                                    state: state,
                                    source: 'AGENT',
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, this.finishAction(sessionId, {
                                    success: true,
                                    message: "LED turned ".concat(state ? 'ON' : 'OFF', "."),
                                })];
                        case 4:
                            if (!(tool === 'triggerFeed')) return [3 /*break*/, 6];
                            cycles = Math.min(5, Math.max(1, Number(args.cycles) || 2));
                            return [4 /*yield*/, this.actuators.triggerActuator({
                                    actuatorId: 1,
                                    type: 'FEEDER',
                                    relayChannel: 1,
                                    state: true,
                                    source: 'AGENT',
                                })];
                        case 5:
                            _a.sent();
                            return [2 /*return*/, this.finishAction(sessionId, {
                                    success: true,
                                    message: "Feeder triggered for ".concat(cycles, " cycle(s)."),
                                })];
                        case 6: return [2 /*return*/, this.finishAction(sessionId, {
                                success: false,
                                message: "Unknown action: ".concat(tool),
                            })];
                        case 7:
                            err_2 = _a.sent();
                            return [2 /*return*/, this.finishAction(sessionId, {
                                    success: false,
                                    message: err_2.message,
                                })];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        AgentService_1.prototype.finishAction = function (sessionId, result) {
            return __awaiter(this, void 0, void 0, function () {
                var e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!sessionId) return [3 /*break*/, 4];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.chatRepo.save(this.chatRepo.create({
                                    sessionId: sessionId,
                                    role: 'assistant',
                                    content: result.success
                                        ? "OK ".concat(result.message)
                                        : "FAILED ".concat(result.message),
                                }))];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_2 = _a.sent();
                            this.logger.warn("Could not persist confirm result: ".concat(e_2.message));
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/, result];
                    }
                });
            });
        };
        AgentService_1.prototype.summarizeProposal = function (p) {
            var _a, _b;
            var labels = {
                controlPump: "turn the air pump ".concat(p.args.state ? 'ON' : 'OFF'),
                controlLed: "turn the LED strip ".concat(p.args.state ? 'ON' : 'OFF'),
                triggerFeed: "feed the fish (".concat((_a = p.args.cycles) !== null && _a !== void 0 ? _a : 2, " cycle").concat(Number(p.args.cycles) === 1 ? '' : 's', ")"),
            };
            return "".concat(p.reason, " I recommend to ").concat((_b = labels[p.tool]) !== null && _b !== void 0 ? _b : p.tool, ". Confirm?");
        };
        AgentService_1.prototype.getSessionMessages = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var rows;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.chatRepo.find({
                                where: { sessionId: id },
                                order: { createdAt: 'ASC' },
                            })];
                        case 1:
                            rows = _a.sent();
                            return [2 /*return*/, rows.map(function (r) { return (__assign(__assign({}, r), { content: r.role === 'user'
                                        ? r.content.replace(/^\[Live tank:[^\]]*\]\s*User:\s*/i, '').trim()
                                        : r.content })); })];
                    }
                });
            });
        };
        AgentService_1.prototype.listChatSessions = function () {
            return __awaiter(this, void 0, void 0, function () {
                var all, map, _i, all_1, m, entry;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.chatRepo.find({ order: { createdAt: 'ASC' } })];
                        case 1:
                            all = _a.sent();
                            map = new Map();
                            for (_i = 0, all_1 = all; _i < all_1.length; _i++) {
                                m = all_1[_i];
                                if (!map.has(m.sessionId))
                                    map.set(m.sessionId, { createdAt: m.createdAt, count: 0, preview: '' });
                                entry = map.get(m.sessionId);
                                entry.count++;
                                if (m.role === 'user' && !entry.preview) {
                                    entry.preview = m.content
                                        .replace(/^\[Live tank:[^\]]*\]\s*User:\s*/i, '')
                                        .trim()
                                        .slice(0, 80);
                                }
                            }
                            return [2 /*return*/, Array.from(map.entries())
                                    .map(function (_a) {
                                    var sessionId = _a[0], e = _a[1];
                                    return ({
                                        sessionId: sessionId,
                                        preview: e.preview || 'Empty chat',
                                        createdAt: e.createdAt,
                                        messageCount: e.count,
                                    });
                                })
                                    .sort(function (a, b) { return b.createdAt.getTime() - a.createdAt.getTime(); })];
                    }
                });
            });
        };
        AgentService_1.prototype.deleteSession = function (id) {
            return this.chatRepo.delete({ sessionId: id });
        };
        AgentService_1.prototype.loadHistory = function (sessionId) {
            return __awaiter(this, void 0, void 0, function () {
                var rows;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.chatRepo.find({
                                where: { sessionId: sessionId },
                                order: { createdAt: 'ASC' },
                                take: 20,
                            })];
                        case 1:
                            rows = _a.sent();
                            return [2 /*return*/, rows.map(function (r) { return ({
                                    role: r.role,
                                    content: r.content,
                                }); })];
                    }
                });
            });
        };
        AgentService_1.prototype.saveMessages = function (sessionId, userText, assistantText) {
            return __awaiter(this, void 0, void 0, function () {
                var cleanUserText;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cleanUserText = userText
                                .replace(/^\[Live tank:[^\]]*\]\s*User:\s*/i, '')
                                .trim();
                            return [4 /*yield*/, this.chatRepo.save([
                                    this.chatRepo.create({ sessionId: sessionId, role: 'user', content: cleanUserText }),
                                    this.chatRepo.create({
                                        sessionId: sessionId,
                                        role: 'assistant',
                                        content: assistantText,
                                    }),
                                ])];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        AgentService_1.prototype.callModel = function (messages) {
            return __awaiter(this, void 0, void 0, function () {
                var res_1, message, res;
                var _this = this;
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
                return __generator(this, function (_r) {
                    switch (_r.label) {
                        case 0:
                            if (!(this.llmProvider === 'openrouter')) return [3 /*break*/, 2];
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.http.post("".concat(this.openRouterUrl, "/chat/completions"), {
                                    model: this.model,
                                    messages: messages,
                                    tools: agent_tools_1.AGENT_TOOLS,
                                }, {
                                    headers: this.buildOpenRouterHeaders(),
                                }))];
                        case 1:
                            res_1 = _r.sent();
                            message = (_c = (_b = (_a = res_1.data) === null || _a === void 0 ? void 0 : _a.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message;
                            return [2 /*return*/, {
                                    message: {
                                        role: (_d = message === null || message === void 0 ? void 0 : message.role) !== null && _d !== void 0 ? _d : 'assistant',
                                        content: (_e = message === null || message === void 0 ? void 0 : message.content) !== null && _e !== void 0 ? _e : '',
                                        tool_calls: ((_f = message === null || message === void 0 ? void 0 : message.tool_calls) !== null && _f !== void 0 ? _f : []).map(function (call) {
                                            var _a, _b, _c;
                                            return ({
                                                id: call.id,
                                                function: {
                                                    name: (_b = (_a = call.function) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '',
                                                    arguments: _this.parseToolArguments((_c = call.function) === null || _c === void 0 ? void 0 : _c.arguments),
                                                },
                                            });
                                        }),
                                    },
                                }];
                        case 2: return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.http.post("".concat(this.ollamaUrl, "/api/chat"), {
                                model: this.model,
                                messages: messages,
                                tools: agent_tools_1.AGENT_TOOLS,
                                stream: false,
                            }))];
                        case 3:
                            res = _r.sent();
                            return [2 /*return*/, {
                                    message: {
                                        role: (_j = (_h = (_g = res.data) === null || _g === void 0 ? void 0 : _g.message) === null || _h === void 0 ? void 0 : _h.role) !== null && _j !== void 0 ? _j : 'assistant',
                                        content: (_m = (_l = (_k = res.data) === null || _k === void 0 ? void 0 : _k.message) === null || _l === void 0 ? void 0 : _l.content) !== null && _m !== void 0 ? _m : '',
                                        tool_calls: (_q = (_p = (_o = res.data) === null || _o === void 0 ? void 0 : _o.message) === null || _p === void 0 ? void 0 : _p.tool_calls) !== null && _q !== void 0 ? _q : [],
                                    },
                                }];
                    }
                });
            });
        };
        AgentService_1.prototype.parseToolArguments = function (raw) {
            if (!raw)
                return {};
            try {
                var parsed = JSON.parse(raw);
                return typeof parsed === 'object' && parsed ? parsed : {};
            }
            catch (_a) {
                return {};
            }
        };
        AgentService_1.prototype.buildOpenRouterHeaders = function () {
            return {
                Authorization: "Bearer ".concat(this.openRouterKey),
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://fishlinic.local',
                'X-Title': 'Fishlinic',
            };
        };
        AgentService_1.prototype.buildDeps = function () {
            var _this = this;
            return {
                getSensorReadings: function () { return __awaiter(_this, void 0, void 0, function () {
                    var readings;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.sensors.getLatest()];
                            case 1:
                                readings = _a.sent();
                                return [2 /*return*/, readings
                                        .filter(function (r) { var _a; return ((_a = r.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== 'co2'; })
                                        .map(function (r) {
                                        var _a;
                                        return ({
                                            type: r.type,
                                            value: Number(r.value),
                                            unit: r.unit,
                                            status: (_a = r.status) !== null && _a !== void 0 ? _a : 'unknown',
                                        });
                                    })];
                        }
                    });
                }); },
                getSensorHistory: function () { return __awaiter(_this, void 0, void 0, function () {
                    var history;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.sensors.getAllHistory('1h')];
                            case 1:
                                history = _a.sent();
                                return [2 /*return*/, history
                                        .filter(function (r) { var _a; return ((_a = r.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== 'co2'; })
                                        .map(function (r) {
                                        var _a, _b, _c;
                                        return ({
                                            type: r.type,
                                            value: Number(r.value),
                                            unit: r.unit,
                                            timestamp: (_c = (_b = (_a = r.timestamp) === null || _a === void 0 ? void 0 : _a.toISOString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : '',
                                        });
                                    })];
                        }
                    });
                }); },
                runBehaviorAnalysis: function () { return __awaiter(_this, void 0, void 0, function () {
                    var result;
                    var _a, _b, _c, _d;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0: return [4 /*yield*/, this.vision.runFullAnalysis('AGENT_FRESH')];
                            case 1:
                                result = _e.sent();
                                return [2 /*return*/, {
                                        behavior: (_a = result.behavior) !== null && _a !== void 0 ? _a : {},
                                        count: (_b = result.count) !== null && _b !== void 0 ? _b : {},
                                        disease: (_c = result.disease) !== null && _c !== void 0 ? _c : {},
                                        quality: (_d = result.quality) !== null && _d !== void 0 ? _d : {},
                                        reportId: result.reportId,
                                    }];
                        }
                    });
                }); },
                getActuatorState: function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.actuators.getState()];
                            case 1: return [2 /*return*/, _a.sent()];
                        }
                    });
                }); },
                getThresholds: function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        return [2 /*return*/, ({
                                pH: { min: 6.8, max: 7.5 },
                                temp_c: { min: 24, max: 28 },
                                do_mg_l: { min: 6, max: 9 },
                            })];
                    });
                }); },
                getDiagnoses: function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.fish.getLatestDiagnoses(5)];
                            case 1: return [2 /*return*/, _a.sent()];
                        }
                    });
                }); },
            };
        };
        return AgentService_1;
    }());
    __setFunctionName(_classThis, "AgentService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgentService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgentService = _classThis;
}();
exports.AgentService = AgentService;
