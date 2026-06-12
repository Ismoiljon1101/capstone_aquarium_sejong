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
exports.AlertEntity = void 0;
var typeorm_1 = require("typeorm");
var AlertEntity = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('alerts')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _alertId_decorators;
    var _alertId_initializers = [];
    var _alertId_extraInitializers = [];
    var _sensorId_decorators;
    var _sensorId_initializers = [];
    var _sensorId_extraInitializers = [];
    var _tankId_decorators;
    var _tankId_initializers = [];
    var _tankId_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _severity_decorators;
    var _severity_initializers = [];
    var _severity_extraInitializers = [];
    var _message_decorators;
    var _message_initializers = [];
    var _message_extraInitializers = [];
    var _acknowledged_decorators;
    var _acknowledged_initializers = [];
    var _acknowledged_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var AlertEntity = _classThis = /** @class */ (function () {
        function AlertEntity_1() {
            this.alertId = __runInitializers(this, _alertId_initializers, void 0);
            this.sensorId = (__runInitializers(this, _alertId_extraInitializers), __runInitializers(this, _sensorId_initializers, void 0));
            this.tankId = (__runInitializers(this, _sensorId_extraInitializers), __runInitializers(this, _tankId_initializers, void 0));
            this.type = (__runInitializers(this, _tankId_extraInitializers), __runInitializers(this, _type_initializers, void 0));
            this.severity = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _severity_initializers, void 0)); // INFO, WARNING, CRITICAL, EMERGENCY
            this.message = (__runInitializers(this, _severity_extraInitializers), __runInitializers(this, _message_initializers, void 0));
            this.acknowledged = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _acknowledged_initializers, void 0));
            this.createdAt = (__runInitializers(this, _acknowledged_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            __runInitializers(this, _createdAt_extraInitializers);
        }
        return AlertEntity_1;
    }());
    __setFunctionName(_classThis, "AlertEntity");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _alertId_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _sensorId_decorators = [(0, typeorm_1.Column)()];
        _tankId_decorators = [(0, typeorm_1.Column)()];
        _type_decorators = [(0, typeorm_1.Column)()];
        _severity_decorators = [(0, typeorm_1.Column)()];
        _message_decorators = [(0, typeorm_1.Column)('text')];
        _acknowledged_decorators = [(0, typeorm_1.Column)({ default: false })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _alertId_decorators, { kind: "field", name: "alertId", static: false, private: false, access: { has: function (obj) { return "alertId" in obj; }, get: function (obj) { return obj.alertId; }, set: function (obj, value) { obj.alertId = value; } }, metadata: _metadata }, _alertId_initializers, _alertId_extraInitializers);
        __esDecorate(null, null, _sensorId_decorators, { kind: "field", name: "sensorId", static: false, private: false, access: { has: function (obj) { return "sensorId" in obj; }, get: function (obj) { return obj.sensorId; }, set: function (obj, value) { obj.sensorId = value; } }, metadata: _metadata }, _sensorId_initializers, _sensorId_extraInitializers);
        __esDecorate(null, null, _tankId_decorators, { kind: "field", name: "tankId", static: false, private: false, access: { has: function (obj) { return "tankId" in obj; }, get: function (obj) { return obj.tankId; }, set: function (obj, value) { obj.tankId = value; } }, metadata: _metadata }, _tankId_initializers, _tankId_extraInitializers);
        __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
        __esDecorate(null, null, _severity_decorators, { kind: "field", name: "severity", static: false, private: false, access: { has: function (obj) { return "severity" in obj; }, get: function (obj) { return obj.severity; }, set: function (obj, value) { obj.severity = value; } }, metadata: _metadata }, _severity_initializers, _severity_extraInitializers);
        __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: function (obj) { return "message" in obj; }, get: function (obj) { return obj.message; }, set: function (obj, value) { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
        __esDecorate(null, null, _acknowledged_decorators, { kind: "field", name: "acknowledged", static: false, private: false, access: { has: function (obj) { return "acknowledged" in obj; }, get: function (obj) { return obj.acknowledged; }, set: function (obj, value) { obj.acknowledged = value; } }, metadata: _metadata }, _acknowledged_initializers, _acknowledged_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AlertEntity = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AlertEntity = _classThis;
}();
exports.AlertEntity = AlertEntity;
