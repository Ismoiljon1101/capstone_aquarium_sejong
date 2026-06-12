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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceSessionEntity = void 0;
var typeorm_1 = require("typeorm");
var VoiceSessionEntity = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('voice_sessions')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _sessionId_decorators;
    var _sessionId_initializers = [];
    var _sessionId_extraInitializers = [];
    var _snapshotId_decorators;
    var _snapshotId_initializers = [];
    var _snapshotId_extraInitializers = [];
    var _wakeWordAt_decorators;
    var _wakeWordAt_initializers = [];
    var _wakeWordAt_extraInitializers = [];
    var _transcribedText_decorators;
    var _transcribedText_initializers = [];
    var _transcribedText_extraInitializers = [];
    var _aiResponse_decorators;
    var _aiResponse_initializers = [];
    var _aiResponse_extraInitializers = [];
    var _audioOutputPath_decorators;
    var _audioOutputPath_initializers = [];
    var _audioOutputPath_extraInitializers = [];
    var _durationMs_decorators;
    var _durationMs_initializers = [];
    var _durationMs_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var VoiceSessionEntity = _classThis = /** @class */ (function () {
        function VoiceSessionEntity_1() {
            this.sessionId = __runInitializers(this, _sessionId_initializers, void 0);
            this.snapshotId = (__runInitializers(this, _sessionId_extraInitializers), __runInitializers(this, _snapshotId_initializers, void 0));
            this.wakeWordAt = (__runInitializers(this, _snapshotId_extraInitializers), __runInitializers(this, _wakeWordAt_initializers, void 0));
            this.transcribedText = (__runInitializers(this, _wakeWordAt_extraInitializers), __runInitializers(this, _transcribedText_initializers, void 0));
            this.aiResponse = (__runInitializers(this, _transcribedText_extraInitializers), __runInitializers(this, _aiResponse_initializers, void 0));
            this.audioOutputPath = (__runInitializers(this, _aiResponse_extraInitializers), __runInitializers(this, _audioOutputPath_initializers, void 0));
            this.durationMs = (__runInitializers(this, _audioOutputPath_extraInitializers), __runInitializers(this, _durationMs_initializers, void 0));
            this.createdAt = (__runInitializers(this, _durationMs_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            __runInitializers(this, _createdAt_extraInitializers);
        }
        return VoiceSessionEntity_1;
    }());
    __setFunctionName(_classThis, "VoiceSessionEntity");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _sessionId_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _snapshotId_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _wakeWordAt_decorators = [(0, typeorm_1.Column)()];
        _transcribedText_decorators = [(0, typeorm_1.Column)('text')];
        _aiResponse_decorators = [(0, typeorm_1.Column)('text')];
        _audioOutputPath_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _durationMs_decorators = [(0, typeorm_1.Column)()];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _sessionId_decorators, { kind: "field", name: "sessionId", static: false, private: false, access: { has: function (obj) { return "sessionId" in obj; }, get: function (obj) { return obj.sessionId; }, set: function (obj, value) { obj.sessionId = value; } }, metadata: _metadata }, _sessionId_initializers, _sessionId_extraInitializers);
        __esDecorate(null, null, _snapshotId_decorators, { kind: "field", name: "snapshotId", static: false, private: false, access: { has: function (obj) { return "snapshotId" in obj; }, get: function (obj) { return obj.snapshotId; }, set: function (obj, value) { obj.snapshotId = value; } }, metadata: _metadata }, _snapshotId_initializers, _snapshotId_extraInitializers);
        __esDecorate(null, null, _wakeWordAt_decorators, { kind: "field", name: "wakeWordAt", static: false, private: false, access: { has: function (obj) { return "wakeWordAt" in obj; }, get: function (obj) { return obj.wakeWordAt; }, set: function (obj, value) { obj.wakeWordAt = value; } }, metadata: _metadata }, _wakeWordAt_initializers, _wakeWordAt_extraInitializers);
        __esDecorate(null, null, _transcribedText_decorators, { kind: "field", name: "transcribedText", static: false, private: false, access: { has: function (obj) { return "transcribedText" in obj; }, get: function (obj) { return obj.transcribedText; }, set: function (obj, value) { obj.transcribedText = value; } }, metadata: _metadata }, _transcribedText_initializers, _transcribedText_extraInitializers);
        __esDecorate(null, null, _aiResponse_decorators, { kind: "field", name: "aiResponse", static: false, private: false, access: { has: function (obj) { return "aiResponse" in obj; }, get: function (obj) { return obj.aiResponse; }, set: function (obj, value) { obj.aiResponse = value; } }, metadata: _metadata }, _aiResponse_initializers, _aiResponse_extraInitializers);
        __esDecorate(null, null, _audioOutputPath_decorators, { kind: "field", name: "audioOutputPath", static: false, private: false, access: { has: function (obj) { return "audioOutputPath" in obj; }, get: function (obj) { return obj.audioOutputPath; }, set: function (obj, value) { obj.audioOutputPath = value; } }, metadata: _metadata }, _audioOutputPath_initializers, _audioOutputPath_extraInitializers);
        __esDecorate(null, null, _durationMs_decorators, { kind: "field", name: "durationMs", static: false, private: false, access: { has: function (obj) { return "durationMs" in obj; }, get: function (obj) { return obj.durationMs; }, set: function (obj, value) { obj.durationMs = value; } }, metadata: _metadata }, _durationMs_initializers, _durationMs_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VoiceSessionEntity = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VoiceSessionEntity = _classThis;
}();
exports.VoiceSessionEntity = VoiceSessionEntity;
