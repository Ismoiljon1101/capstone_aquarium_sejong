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
exports.LightScheduleEntity = void 0;
var typeorm_1 = require("typeorm");
/**
 * LED lighting schedule. Single-row pattern (id=1) is fine for a single tank,
 * but kept as a table so multiple tanks/profiles work later.
 * Times are HH:MM local. Brightness is 0–100. Color is a #RRGGBB hex string.
 */
var LightScheduleEntity = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('light_schedules')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _onTime_decorators;
    var _onTime_initializers = [];
    var _onTime_extraInitializers = [];
    var _offTime_decorators;
    var _offTime_initializers = [];
    var _offTime_extraInitializers = [];
    var _brightness_decorators;
    var _brightness_initializers = [];
    var _brightness_extraInitializers = [];
    var _color_decorators;
    var _color_initializers = [];
    var _color_extraInitializers = [];
    var _enabled_decorators;
    var _enabled_initializers = [];
    var _enabled_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var LightScheduleEntity = _classThis = /** @class */ (function () {
        function LightScheduleEntity_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.onTime = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _onTime_initializers, void 0));
            this.offTime = (__runInitializers(this, _onTime_extraInitializers), __runInitializers(this, _offTime_initializers, void 0));
            this.brightness = (__runInitializers(this, _offTime_extraInitializers), __runInitializers(this, _brightness_initializers, void 0));
            this.color = (__runInitializers(this, _brightness_extraInitializers), __runInitializers(this, _color_initializers, void 0));
            this.enabled = (__runInitializers(this, _color_extraInitializers), __runInitializers(this, _enabled_initializers, void 0));
            this.createdAt = (__runInitializers(this, _enabled_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            __runInitializers(this, _createdAt_extraInitializers);
        }
        return LightScheduleEntity_1;
    }());
    __setFunctionName(_classThis, "LightScheduleEntity");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _onTime_decorators = [(0, typeorm_1.Column)({ default: '07:00' })];
        _offTime_decorators = [(0, typeorm_1.Column)({ default: '21:00' })];
        _brightness_decorators = [(0, typeorm_1.Column)({ default: 80 })];
        _color_decorators = [(0, typeorm_1.Column)({ default: '#ffffff' })];
        _enabled_decorators = [(0, typeorm_1.Column)({ default: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _onTime_decorators, { kind: "field", name: "onTime", static: false, private: false, access: { has: function (obj) { return "onTime" in obj; }, get: function (obj) { return obj.onTime; }, set: function (obj, value) { obj.onTime = value; } }, metadata: _metadata }, _onTime_initializers, _onTime_extraInitializers);
        __esDecorate(null, null, _offTime_decorators, { kind: "field", name: "offTime", static: false, private: false, access: { has: function (obj) { return "offTime" in obj; }, get: function (obj) { return obj.offTime; }, set: function (obj, value) { obj.offTime = value; } }, metadata: _metadata }, _offTime_initializers, _offTime_extraInitializers);
        __esDecorate(null, null, _brightness_decorators, { kind: "field", name: "brightness", static: false, private: false, access: { has: function (obj) { return "brightness" in obj; }, get: function (obj) { return obj.brightness; }, set: function (obj, value) { obj.brightness = value; } }, metadata: _metadata }, _brightness_initializers, _brightness_extraInitializers);
        __esDecorate(null, null, _color_decorators, { kind: "field", name: "color", static: false, private: false, access: { has: function (obj) { return "color" in obj; }, get: function (obj) { return obj.color; }, set: function (obj, value) { obj.color = value; } }, metadata: _metadata }, _color_initializers, _color_extraInitializers);
        __esDecorate(null, null, _enabled_decorators, { kind: "field", name: "enabled", static: false, private: false, access: { has: function (obj) { return "enabled" in obj; }, get: function (obj) { return obj.enabled; }, set: function (obj, value) { obj.enabled = value; } }, metadata: _metadata }, _enabled_initializers, _enabled_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LightScheduleEntity = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LightScheduleEntity = _classThis;
}();
exports.LightScheduleEntity = LightScheduleEntity;
