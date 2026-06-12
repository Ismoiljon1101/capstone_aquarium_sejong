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
exports.FishGrowth = void 0;
var typeorm_1 = require("typeorm");
var FishGrowth = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('fish_growth')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _growthId_decorators;
    var _growthId_initializers = [];
    var _growthId_extraInitializers = [];
    var _date_decorators;
    var _date_initializers = [];
    var _date_extraInitializers = [];
    var _avgSizeEstimate_decorators;
    var _avgSizeEstimate_initializers = [];
    var _avgSizeEstimate_extraInitializers = [];
    var _count_decorators;
    var _count_initializers = [];
    var _count_extraInitializers = [];
    var _deltaFromPrev_decorators;
    var _deltaFromPrev_initializers = [];
    var _deltaFromPrev_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var FishGrowth = _classThis = /** @class */ (function () {
        function FishGrowth_1() {
            this.growthId = __runInitializers(this, _growthId_initializers, void 0);
            this.date = (__runInitializers(this, _growthId_extraInitializers), __runInitializers(this, _date_initializers, void 0));
            this.avgSizeEstimate = (__runInitializers(this, _date_extraInitializers), __runInitializers(this, _avgSizeEstimate_initializers, void 0));
            this.count = (__runInitializers(this, _avgSizeEstimate_extraInitializers), __runInitializers(this, _count_initializers, void 0));
            this.deltaFromPrev = (__runInitializers(this, _count_extraInitializers), __runInitializers(this, _deltaFromPrev_initializers, void 0));
            this.createdAt = (__runInitializers(this, _deltaFromPrev_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            __runInitializers(this, _createdAt_extraInitializers);
        }
        return FishGrowth_1;
    }());
    __setFunctionName(_classThis, "FishGrowth");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _growthId_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _date_decorators = [(0, typeorm_1.Column)()];
        _avgSizeEstimate_decorators = [(0, typeorm_1.Column)('float')];
        _count_decorators = [(0, typeorm_1.Column)()];
        _deltaFromPrev_decorators = [(0, typeorm_1.Column)('float', { default: 0 })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _growthId_decorators, { kind: "field", name: "growthId", static: false, private: false, access: { has: function (obj) { return "growthId" in obj; }, get: function (obj) { return obj.growthId; }, set: function (obj, value) { obj.growthId = value; } }, metadata: _metadata }, _growthId_initializers, _growthId_extraInitializers);
        __esDecorate(null, null, _date_decorators, { kind: "field", name: "date", static: false, private: false, access: { has: function (obj) { return "date" in obj; }, get: function (obj) { return obj.date; }, set: function (obj, value) { obj.date = value; } }, metadata: _metadata }, _date_initializers, _date_extraInitializers);
        __esDecorate(null, null, _avgSizeEstimate_decorators, { kind: "field", name: "avgSizeEstimate", static: false, private: false, access: { has: function (obj) { return "avgSizeEstimate" in obj; }, get: function (obj) { return obj.avgSizeEstimate; }, set: function (obj, value) { obj.avgSizeEstimate = value; } }, metadata: _metadata }, _avgSizeEstimate_initializers, _avgSizeEstimate_extraInitializers);
        __esDecorate(null, null, _count_decorators, { kind: "field", name: "count", static: false, private: false, access: { has: function (obj) { return "count" in obj; }, get: function (obj) { return obj.count; }, set: function (obj, value) { obj.count = value; } }, metadata: _metadata }, _count_initializers, _count_extraInitializers);
        __esDecorate(null, null, _deltaFromPrev_decorators, { kind: "field", name: "deltaFromPrev", static: false, private: false, access: { has: function (obj) { return "deltaFromPrev" in obj; }, get: function (obj) { return obj.deltaFromPrev; }, set: function (obj, value) { obj.deltaFromPrev = value; } }, metadata: _metadata }, _deltaFromPrev_initializers, _deltaFromPrev_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FishGrowth = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FishGrowth = _classThis;
}();
exports.FishGrowth = FishGrowth;
