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
exports.FeedScheduleEntity = void 0;
var typeorm_1 = require("typeorm");
/**
 * User-defined feeding schedule.
 * `time` is HH:MM in 24-hour local time.
 * `daysMask` is a bitmask of weekdays: bit 0 = Sunday … bit 6 = Saturday. 127 = every day.
 * `portionSec` is how long the feeder motor stays on per trigger.
 */
var FeedScheduleEntity = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('feed_schedules')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _time_decorators;
    var _time_initializers = [];
    var _time_extraInitializers = [];
    var _daysMask_decorators;
    var _daysMask_initializers = [];
    var _daysMask_extraInitializers = [];
    var _portionSec_decorators;
    var _portionSec_initializers = [];
    var _portionSec_extraInitializers = [];
    var _enabled_decorators;
    var _enabled_initializers = [];
    var _enabled_extraInitializers = [];
    var _lastFiredAt_decorators;
    var _lastFiredAt_initializers = [];
    var _lastFiredAt_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var FeedScheduleEntity = _classThis = /** @class */ (function () {
        function FeedScheduleEntity_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.time = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _time_initializers, void 0)); // "08:00"
            this.daysMask = (__runInitializers(this, _time_extraInitializers), __runInitializers(this, _daysMask_initializers, void 0));
            this.portionSec = (__runInitializers(this, _daysMask_extraInitializers), __runInitializers(this, _portionSec_initializers, void 0));
            this.enabled = (__runInitializers(this, _portionSec_extraInitializers), __runInitializers(this, _enabled_initializers, void 0));
            this.lastFiredAt = (__runInitializers(this, _enabled_extraInitializers), __runInitializers(this, _lastFiredAt_initializers, void 0));
            this.createdAt = (__runInitializers(this, _lastFiredAt_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            __runInitializers(this, _createdAt_extraInitializers);
        }
        return FeedScheduleEntity_1;
    }());
    __setFunctionName(_classThis, "FeedScheduleEntity");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _time_decorators = [(0, typeorm_1.Column)()];
        _daysMask_decorators = [(0, typeorm_1.Column)({ default: 127 })];
        _portionSec_decorators = [(0, typeorm_1.Column)({ default: 3 })];
        _enabled_decorators = [(0, typeorm_1.Column)({ default: true })];
        _lastFiredAt_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _time_decorators, { kind: "field", name: "time", static: false, private: false, access: { has: function (obj) { return "time" in obj; }, get: function (obj) { return obj.time; }, set: function (obj, value) { obj.time = value; } }, metadata: _metadata }, _time_initializers, _time_extraInitializers);
        __esDecorate(null, null, _daysMask_decorators, { kind: "field", name: "daysMask", static: false, private: false, access: { has: function (obj) { return "daysMask" in obj; }, get: function (obj) { return obj.daysMask; }, set: function (obj, value) { obj.daysMask = value; } }, metadata: _metadata }, _daysMask_initializers, _daysMask_extraInitializers);
        __esDecorate(null, null, _portionSec_decorators, { kind: "field", name: "portionSec", static: false, private: false, access: { has: function (obj) { return "portionSec" in obj; }, get: function (obj) { return obj.portionSec; }, set: function (obj, value) { obj.portionSec = value; } }, metadata: _metadata }, _portionSec_initializers, _portionSec_extraInitializers);
        __esDecorate(null, null, _enabled_decorators, { kind: "field", name: "enabled", static: false, private: false, access: { has: function (obj) { return "enabled" in obj; }, get: function (obj) { return obj.enabled; }, set: function (obj, value) { obj.enabled = value; } }, metadata: _metadata }, _enabled_initializers, _enabled_extraInitializers);
        __esDecorate(null, null, _lastFiredAt_decorators, { kind: "field", name: "lastFiredAt", static: false, private: false, access: { has: function (obj) { return "lastFiredAt" in obj; }, get: function (obj) { return obj.lastFiredAt; }, set: function (obj, value) { obj.lastFiredAt = value; } }, metadata: _metadata }, _lastFiredAt_initializers, _lastFiredAt_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FeedScheduleEntity = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FeedScheduleEntity = _classThis;
}();
exports.FeedScheduleEntity = FeedScheduleEntity;
