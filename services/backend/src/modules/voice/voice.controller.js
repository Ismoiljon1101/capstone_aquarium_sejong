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
exports.VoiceController = void 0;
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var VoiceController = function () {
    var _classDecorators = [(0, common_1.Controller)('voice')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getLlmStatus_decorators;
    var _handleQuery_decorators;
    var _runAgent_decorators;
    var _newSession_decorators;
    var _getSessionMessages_decorators;
    var _deleteSession_decorators;
    var _confirmAction_decorators;
    var _getSessions_decorators;
    var _listChatSessions_decorators;
    var VoiceController = _classThis = /** @class */ (function () {
        function VoiceController_1(voiceService, agentService, config) {
            this.voiceService = (__runInitializers(this, _instanceExtraInitializers), voiceService);
            this.agentService = agentService;
            this.config = config;
        }
        VoiceController_1.prototype.getLlmStatus = function () {
            var _a, _b, _c;
            var provider = (_a = this.config.get('LLM_PROVIDER')) !== null && _a !== void 0 ? _a : 'openrouter';
            var model = provider === 'openrouter'
                ? ((_b = this.config.get('OPENROUTER_MODEL')) !== null && _b !== void 0 ? _b : 'google/gemini-2.0-flash-lite:free')
                : ((_c = this.config.get('OLLAMA_MODEL')) !== null && _c !== void 0 ? _c : 'batiai/gemma4-e4b:q4');
            return {
                provider: provider,
                model: model,
                hasKey: !!this.config.get('OPENROUTER_API_KEY'),
            };
        };
        VoiceController_1.prototype.handleQuery = function (text, snapshotId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.voiceService.handleQuery(text, snapshotId)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        // Agent: reason + propose (no side effects until /agent/confirm)
        VoiceController_1.prototype.runAgent = function (text, sessionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.agentService.run(text, sessionId)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        // Session management
        VoiceController_1.prototype.newSession = function () {
            return { sessionId: (0, crypto_1.randomUUID)() };
        };
        VoiceController_1.prototype.getSessionMessages = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.agentService.getSessionMessages(id)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        VoiceController_1.prototype.deleteSession = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.agentService.deleteSession(id)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        // Agent: execute a confirmed write action
        VoiceController_1.prototype.confirmAction = function (tool, args, sessionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.agentService.executeConfirmedAction(tool, args, sessionId)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        VoiceController_1.prototype.getSessions = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.voiceService.getSessions()];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        VoiceController_1.prototype.listChatSessions = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.agentService.listChatSessions()];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        return VoiceController_1;
    }());
    __setFunctionName(_classThis, "VoiceController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getLlmStatus_decorators = [(0, common_1.Get)('status')];
        _handleQuery_decorators = [(0, common_1.Post)('query')];
        _runAgent_decorators = [(0, common_1.Post)('agent')];
        _newSession_decorators = [(0, common_1.Post)('sessions/new')];
        _getSessionMessages_decorators = [(0, common_1.Get)('sessions/:id/messages')];
        _deleteSession_decorators = [(0, common_1.Delete)('sessions/:id')];
        _confirmAction_decorators = [(0, common_1.Post)('agent/confirm')];
        _getSessions_decorators = [(0, common_1.Get)('sessions')];
        _listChatSessions_decorators = [(0, common_1.Get)('chat-sessions')];
        __esDecorate(_classThis, null, _getLlmStatus_decorators, { kind: "method", name: "getLlmStatus", static: false, private: false, access: { has: function (obj) { return "getLlmStatus" in obj; }, get: function (obj) { return obj.getLlmStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleQuery_decorators, { kind: "method", name: "handleQuery", static: false, private: false, access: { has: function (obj) { return "handleQuery" in obj; }, get: function (obj) { return obj.handleQuery; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _runAgent_decorators, { kind: "method", name: "runAgent", static: false, private: false, access: { has: function (obj) { return "runAgent" in obj; }, get: function (obj) { return obj.runAgent; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _newSession_decorators, { kind: "method", name: "newSession", static: false, private: false, access: { has: function (obj) { return "newSession" in obj; }, get: function (obj) { return obj.newSession; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSessionMessages_decorators, { kind: "method", name: "getSessionMessages", static: false, private: false, access: { has: function (obj) { return "getSessionMessages" in obj; }, get: function (obj) { return obj.getSessionMessages; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteSession_decorators, { kind: "method", name: "deleteSession", static: false, private: false, access: { has: function (obj) { return "deleteSession" in obj; }, get: function (obj) { return obj.deleteSession; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _confirmAction_decorators, { kind: "method", name: "confirmAction", static: false, private: false, access: { has: function (obj) { return "confirmAction" in obj; }, get: function (obj) { return obj.confirmAction; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSessions_decorators, { kind: "method", name: "getSessions", static: false, private: false, access: { has: function (obj) { return "getSessions" in obj; }, get: function (obj) { return obj.getSessions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listChatSessions_decorators, { kind: "method", name: "listChatSessions", static: false, private: false, access: { has: function (obj) { return "listChatSessions" in obj; }, get: function (obj) { return obj.listChatSessions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VoiceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VoiceController = _classThis;
}();
exports.VoiceController = VoiceController;
