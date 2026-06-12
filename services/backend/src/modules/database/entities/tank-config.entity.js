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
exports.TankConfigEntity = void 0;
var typeorm_1 = require("typeorm");
/**
 * Singleton tank configuration (id=1). Holds thresholds, reminder intervals,
 * and emergency safety bounds that the user can edit from the mobile app.
 */
var TankConfigEntity = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('tank_config')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _cleaningIntervalDays_decorators;
    var _cleaningIntervalDays_initializers = [];
    var _cleaningIntervalDays_extraInitializers = [];
    var _lastCleanedAt_decorators;
    var _lastCleanedAt_initializers = [];
    var _lastCleanedAt_extraInitializers = [];
    var _emergencyTempMax_decorators;
    var _emergencyTempMax_initializers = [];
    var _emergencyTempMax_extraInitializers = [];
    var _emergencyTempMin_decorators;
    var _emergencyTempMin_initializers = [];
    var _emergencyTempMin_extraInitializers = [];
    var _emergencyDoMin_decorators;
    var _emergencyDoMin_initializers = [];
    var _emergencyDoMin_extraInitializers = [];
    var _emergencyPhMin_decorators;
    var _emergencyPhMin_initializers = [];
    var _emergencyPhMin_extraInitializers = [];
    var _emergencyPhMax_decorators;
    var _emergencyPhMax_initializers = [];
    var _emergencyPhMax_extraInitializers = [];
    var _pushToken_decorators;
    var _pushToken_initializers = [];
    var _pushToken_extraInitializers = [];
    var _pushEnabled_decorators;
    var _pushEnabled_initializers = [];
    var _pushEnabled_extraInitializers = [];
    var _agentMode_decorators;
    var _agentMode_initializers = [];
    var _agentMode_extraInitializers = [];
    var _agentMonitorEnabled_decorators;
    var _agentMonitorEnabled_initializers = [];
    var _agentMonitorEnabled_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var TankConfigEntity = _classThis = /** @class */ (function () {
        function TankConfigEntity_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // Cleaning reminder
            this.cleaningIntervalDays = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _cleaningIntervalDays_initializers, void 0));
            this.lastCleanedAt = (__runInitializers(this, _cleaningIntervalDays_extraInitializers), __runInitializers(this, _lastCleanedAt_initializers, void 0));
            // Emergency safety thresholds (override evaluator defaults if set)
            this.emergencyTempMax = (__runInitializers(this, _lastCleanedAt_extraInitializers), __runInitializers(this, _emergencyTempMax_initializers, void 0));
            this.emergencyTempMin = (__runInitializers(this, _emergencyTempMax_extraInitializers), __runInitializers(this, _emergencyTempMin_initializers, void 0));
            this.emergencyDoMin = (__runInitializers(this, _emergencyTempMin_extraInitializers), __runInitializers(this, _emergencyDoMin_initializers, void 0));
            this.emergencyPhMin = (__runInitializers(this, _emergencyDoMin_extraInitializers), __runInitializers(this, _emergencyPhMin_initializers, void 0));
            this.emergencyPhMax = (__runInitializers(this, _emergencyPhMin_extraInitializers), __runInitializers(this, _emergencyPhMax_initializers, void 0));
            // Push notification token (Expo)
            this.pushToken = (__runInitializers(this, _emergencyPhMax_extraInitializers), __runInitializers(this, _pushToken_initializers, void 0));
            this.pushEnabled = (__runInitializers(this, _pushToken_extraInitializers), __runInitializers(this, _pushEnabled_initializers, void 0));
            // AI Agent settings
            this.agentMode = (__runInitializers(this, _pushEnabled_extraInitializers), __runInitializers(this, _agentMode_initializers, void 0)); // 'confirm' | 'auto'
            this.agentMonitorEnabled = (__runInitializers(this, _agentMode_extraInitializers), __runInitializers(this, _agentMonitorEnabled_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _agentMonitorEnabled_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
        return TankConfigEntity_1;
    }());
    __setFunctionName(_classThis, "TankConfigEntity");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryColumn)({ default: 1 })];
        _cleaningIntervalDays_decorators = [(0, typeorm_1.Column)({ default: 14 })];
        _lastCleanedAt_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _emergencyTempMax_decorators = [(0, typeorm_1.Column)('float', { default: 30.0 })];
        _emergencyTempMin_decorators = [(0, typeorm_1.Column)('float', { default: 20.0 })];
        _emergencyDoMin_decorators = [(0, typeorm_1.Column)('float', { default: 4.0 })];
        _emergencyPhMin_decorators = [(0, typeorm_1.Column)('float', { default: 6.0 })];
        _emergencyPhMax_decorators = [(0, typeorm_1.Column)('float', { default: 8.5 })];
        _pushToken_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _pushEnabled_decorators = [(0, typeorm_1.Column)({ default: true })];
        _agentMode_decorators = [(0, typeorm_1.Column)({ default: 'confirm' })];
        _agentMonitorEnabled_decorators = [(0, typeorm_1.Column)({ default: true })];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _cleaningIntervalDays_decorators, { kind: "field", name: "cleaningIntervalDays", static: false, private: false, access: { has: function (obj) { return "cleaningIntervalDays" in obj; }, get: function (obj) { return obj.cleaningIntervalDays; }, set: function (obj, value) { obj.cleaningIntervalDays = value; } }, metadata: _metadata }, _cleaningIntervalDays_initializers, _cleaningIntervalDays_extraInitializers);
        __esDecorate(null, null, _lastCleanedAt_decorators, { kind: "field", name: "lastCleanedAt", static: false, private: false, access: { has: function (obj) { return "lastCleanedAt" in obj; }, get: function (obj) { return obj.lastCleanedAt; }, set: function (obj, value) { obj.lastCleanedAt = value; } }, metadata: _metadata }, _lastCleanedAt_initializers, _lastCleanedAt_extraInitializers);
        __esDecorate(null, null, _emergencyTempMax_decorators, { kind: "field", name: "emergencyTempMax", static: false, private: false, access: { has: function (obj) { return "emergencyTempMax" in obj; }, get: function (obj) { return obj.emergencyTempMax; }, set: function (obj, value) { obj.emergencyTempMax = value; } }, metadata: _metadata }, _emergencyTempMax_initializers, _emergencyTempMax_extraInitializers);
        __esDecorate(null, null, _emergencyTempMin_decorators, { kind: "field", name: "emergencyTempMin", static: false, private: false, access: { has: function (obj) { return "emergencyTempMin" in obj; }, get: function (obj) { return obj.emergencyTempMin; }, set: function (obj, value) { obj.emergencyTempMin = value; } }, metadata: _metadata }, _emergencyTempMin_initializers, _emergencyTempMin_extraInitializers);
        __esDecorate(null, null, _emergencyDoMin_decorators, { kind: "field", name: "emergencyDoMin", static: false, private: false, access: { has: function (obj) { return "emergencyDoMin" in obj; }, get: function (obj) { return obj.emergencyDoMin; }, set: function (obj, value) { obj.emergencyDoMin = value; } }, metadata: _metadata }, _emergencyDoMin_initializers, _emergencyDoMin_extraInitializers);
        __esDecorate(null, null, _emergencyPhMin_decorators, { kind: "field", name: "emergencyPhMin", static: false, private: false, access: { has: function (obj) { return "emergencyPhMin" in obj; }, get: function (obj) { return obj.emergencyPhMin; }, set: function (obj, value) { obj.emergencyPhMin = value; } }, metadata: _metadata }, _emergencyPhMin_initializers, _emergencyPhMin_extraInitializers);
        __esDecorate(null, null, _emergencyPhMax_decorators, { kind: "field", name: "emergencyPhMax", static: false, private: false, access: { has: function (obj) { return "emergencyPhMax" in obj; }, get: function (obj) { return obj.emergencyPhMax; }, set: function (obj, value) { obj.emergencyPhMax = value; } }, metadata: _metadata }, _emergencyPhMax_initializers, _emergencyPhMax_extraInitializers);
        __esDecorate(null, null, _pushToken_decorators, { kind: "field", name: "pushToken", static: false, private: false, access: { has: function (obj) { return "pushToken" in obj; }, get: function (obj) { return obj.pushToken; }, set: function (obj, value) { obj.pushToken = value; } }, metadata: _metadata }, _pushToken_initializers, _pushToken_extraInitializers);
        __esDecorate(null, null, _pushEnabled_decorators, { kind: "field", name: "pushEnabled", static: false, private: false, access: { has: function (obj) { return "pushEnabled" in obj; }, get: function (obj) { return obj.pushEnabled; }, set: function (obj, value) { obj.pushEnabled = value; } }, metadata: _metadata }, _pushEnabled_initializers, _pushEnabled_extraInitializers);
        __esDecorate(null, null, _agentMode_decorators, { kind: "field", name: "agentMode", static: false, private: false, access: { has: function (obj) { return "agentMode" in obj; }, get: function (obj) { return obj.agentMode; }, set: function (obj, value) { obj.agentMode = value; } }, metadata: _metadata }, _agentMode_initializers, _agentMode_extraInitializers);
        __esDecorate(null, null, _agentMonitorEnabled_decorators, { kind: "field", name: "agentMonitorEnabled", static: false, private: false, access: { has: function (obj) { return "agentMonitorEnabled" in obj; }, get: function (obj) { return obj.agentMonitorEnabled; }, set: function (obj, value) { obj.agentMonitorEnabled = value; } }, metadata: _metadata }, _agentMonitorEnabled_initializers, _agentMonitorEnabled_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TankConfigEntity = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TankConfigEntity = _classThis;
}();
exports.TankConfigEntity = TankConfigEntity;
