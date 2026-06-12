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
exports.SensorReadingEntity = void 0;
var typeorm_1 = require("typeorm");
var SensorReadingEntity = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('sensor_readings')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _readingId_decorators;
    var _readingId_initializers = [];
    var _readingId_extraInitializers = [];
    var _sensorId_decorators;
    var _sensorId_initializers = [];
    var _sensorId_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _value_decorators;
    var _value_initializers = [];
    var _value_extraInitializers = [];
    var _unit_decorators;
    var _unit_initializers = [];
    var _unit_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _timestamp_decorators;
    var _timestamp_initializers = [];
    var _timestamp_extraInitializers = [];
    var SensorReadingEntity = _classThis = /** @class */ (function () {
        function SensorReadingEntity_1() {
            this.readingId = __runInitializers(this, _readingId_initializers, void 0);
            this.sensorId = (__runInitializers(this, _readingId_extraInitializers), __runInitializers(this, _sensorId_initializers, void 0));
            this.type = (__runInitializers(this, _sensorId_extraInitializers), __runInitializers(this, _type_initializers, void 0)); // pH, temp_c, do_mg_l, CO2
            this.value = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _value_initializers, void 0));
            this.unit = (__runInitializers(this, _value_extraInitializers), __runInitializers(this, _unit_initializers, void 0));
            this.status = (__runInitializers(this, _unit_extraInitializers), __runInitializers(this, _status_initializers, void 0)); // ok, warn, critical
            this.timestamp = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0));
            __runInitializers(this, _timestamp_extraInitializers);
        }
        return SensorReadingEntity_1;
    }());
    __setFunctionName(_classThis, "SensorReadingEntity");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _readingId_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _sensorId_decorators = [(0, typeorm_1.Column)(), (0, typeorm_1.Index)()];
        _type_decorators = [(0, typeorm_1.Column)(), (0, typeorm_1.Index)()];
        _value_decorators = [(0, typeorm_1.Column)('float')];
        _unit_decorators = [(0, typeorm_1.Column)()];
        _status_decorators = [(0, typeorm_1.Column)({ default: 'ok' })];
        _timestamp_decorators = [(0, typeorm_1.CreateDateColumn)(), (0, typeorm_1.Index)()];
        __esDecorate(null, null, _readingId_decorators, { kind: "field", name: "readingId", static: false, private: false, access: { has: function (obj) { return "readingId" in obj; }, get: function (obj) { return obj.readingId; }, set: function (obj, value) { obj.readingId = value; } }, metadata: _metadata }, _readingId_initializers, _readingId_extraInitializers);
        __esDecorate(null, null, _sensorId_decorators, { kind: "field", name: "sensorId", static: false, private: false, access: { has: function (obj) { return "sensorId" in obj; }, get: function (obj) { return obj.sensorId; }, set: function (obj, value) { obj.sensorId = value; } }, metadata: _metadata }, _sensorId_initializers, _sensorId_extraInitializers);
        __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
        __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: function (obj) { return "value" in obj; }, get: function (obj) { return obj.value; }, set: function (obj, value) { obj.value = value; } }, metadata: _metadata }, _value_initializers, _value_extraInitializers);
        __esDecorate(null, null, _unit_decorators, { kind: "field", name: "unit", static: false, private: false, access: { has: function (obj) { return "unit" in obj; }, get: function (obj) { return obj.unit; }, set: function (obj, value) { obj.unit = value; } }, metadata: _metadata }, _unit_initializers, _unit_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: function (obj) { return "timestamp" in obj; }, get: function (obj) { return obj.timestamp; }, set: function (obj, value) { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SensorReadingEntity = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SensorReadingEntity = _classThis;
}();
exports.SensorReadingEntity = SensorReadingEntity;
