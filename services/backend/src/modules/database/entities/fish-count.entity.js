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
exports.FishCount = void 0;
var typeorm_1 = require("typeorm");
var camera_snapshot_entity_1 = require("./camera-snapshot.entity");
var FishCount = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('fish_counts')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _countId_decorators;
    var _countId_initializers = [];
    var _countId_extraInitializers = [];
    var _snapshotId_decorators;
    var _snapshotId_initializers = [];
    var _snapshotId_extraInitializers = [];
    var _snapshot_decorators;
    var _snapshot_initializers = [];
    var _snapshot_extraInitializers = [];
    var _count_decorators;
    var _count_initializers = [];
    var _count_extraInitializers = [];
    var _confidence_decorators;
    var _confidence_initializers = [];
    var _confidence_extraInitializers = [];
    var _timestamp_decorators;
    var _timestamp_initializers = [];
    var _timestamp_extraInitializers = [];
    var FishCount = _classThis = /** @class */ (function () {
        function FishCount_1() {
            this.countId = __runInitializers(this, _countId_initializers, void 0);
            this.snapshotId = (__runInitializers(this, _countId_extraInitializers), __runInitializers(this, _snapshotId_initializers, void 0));
            this.snapshot = (__runInitializers(this, _snapshotId_extraInitializers), __runInitializers(this, _snapshot_initializers, void 0));
            this.count = (__runInitializers(this, _snapshot_extraInitializers), __runInitializers(this, _count_initializers, void 0));
            this.confidence = (__runInitializers(this, _count_extraInitializers), __runInitializers(this, _confidence_initializers, void 0));
            this.timestamp = (__runInitializers(this, _confidence_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0));
            __runInitializers(this, _timestamp_extraInitializers);
        }
        return FishCount_1;
    }());
    __setFunctionName(_classThis, "FishCount");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _countId_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _snapshotId_decorators = [(0, typeorm_1.Column)()];
        _snapshot_decorators = [(0, typeorm_1.ManyToOne)(function () { return camera_snapshot_entity_1.CameraSnapshotEntity; }), (0, typeorm_1.JoinColumn)({ name: 'snapshotId' })];
        _count_decorators = [(0, typeorm_1.Column)()];
        _confidence_decorators = [(0, typeorm_1.Column)('float')];
        _timestamp_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _countId_decorators, { kind: "field", name: "countId", static: false, private: false, access: { has: function (obj) { return "countId" in obj; }, get: function (obj) { return obj.countId; }, set: function (obj, value) { obj.countId = value; } }, metadata: _metadata }, _countId_initializers, _countId_extraInitializers);
        __esDecorate(null, null, _snapshotId_decorators, { kind: "field", name: "snapshotId", static: false, private: false, access: { has: function (obj) { return "snapshotId" in obj; }, get: function (obj) { return obj.snapshotId; }, set: function (obj, value) { obj.snapshotId = value; } }, metadata: _metadata }, _snapshotId_initializers, _snapshotId_extraInitializers);
        __esDecorate(null, null, _snapshot_decorators, { kind: "field", name: "snapshot", static: false, private: false, access: { has: function (obj) { return "snapshot" in obj; }, get: function (obj) { return obj.snapshot; }, set: function (obj, value) { obj.snapshot = value; } }, metadata: _metadata }, _snapshot_initializers, _snapshot_extraInitializers);
        __esDecorate(null, null, _count_decorators, { kind: "field", name: "count", static: false, private: false, access: { has: function (obj) { return "count" in obj; }, get: function (obj) { return obj.count; }, set: function (obj, value) { obj.count = value; } }, metadata: _metadata }, _count_initializers, _count_extraInitializers);
        __esDecorate(null, null, _confidence_decorators, { kind: "field", name: "confidence", static: false, private: false, access: { has: function (obj) { return "confidence" in obj; }, get: function (obj) { return obj.confidence; }, set: function (obj, value) { obj.confidence = value; } }, metadata: _metadata }, _confidence_initializers, _confidence_extraInitializers);
        __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: function (obj) { return "timestamp" in obj; }, get: function (obj) { return obj.timestamp; }, set: function (obj, value) { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FishCount = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FishCount = _classThis;
}();
exports.FishCount = FishCount;
