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
exports.CameraSnapshotEntity = void 0;
var typeorm_1 = require("typeorm");
var CameraSnapshotEntity = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('camera_snapshots')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _snapshotId_decorators;
    var _snapshotId_initializers = [];
    var _snapshotId_extraInitializers = [];
    var _imagePath_decorators;
    var _imagePath_initializers = [];
    var _imagePath_extraInitializers = [];
    var _triggeredBy_decorators;
    var _triggeredBy_initializers = [];
    var _triggeredBy_extraInitializers = [];
    var _timestamp_decorators;
    var _timestamp_initializers = [];
    var _timestamp_extraInitializers = [];
    var CameraSnapshotEntity = _classThis = /** @class */ (function () {
        function CameraSnapshotEntity_1() {
            this.snapshotId = __runInitializers(this, _snapshotId_initializers, void 0);
            this.imagePath = (__runInitializers(this, _snapshotId_extraInitializers), __runInitializers(this, _imagePath_initializers, void 0));
            this.triggeredBy = (__runInitializers(this, _imagePath_extraInitializers), __runInitializers(this, _triggeredBy_initializers, void 0)); // CRON, MANUAL, EVENT
            this.timestamp = (__runInitializers(this, _triggeredBy_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0));
            __runInitializers(this, _timestamp_extraInitializers);
        }
        return CameraSnapshotEntity_1;
    }());
    __setFunctionName(_classThis, "CameraSnapshotEntity");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _snapshotId_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _imagePath_decorators = [(0, typeorm_1.Column)()];
        _triggeredBy_decorators = [(0, typeorm_1.Column)()];
        _timestamp_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _snapshotId_decorators, { kind: "field", name: "snapshotId", static: false, private: false, access: { has: function (obj) { return "snapshotId" in obj; }, get: function (obj) { return obj.snapshotId; }, set: function (obj, value) { obj.snapshotId = value; } }, metadata: _metadata }, _snapshotId_initializers, _snapshotId_extraInitializers);
        __esDecorate(null, null, _imagePath_decorators, { kind: "field", name: "imagePath", static: false, private: false, access: { has: function (obj) { return "imagePath" in obj; }, get: function (obj) { return obj.imagePath; }, set: function (obj, value) { obj.imagePath = value; } }, metadata: _metadata }, _imagePath_initializers, _imagePath_extraInitializers);
        __esDecorate(null, null, _triggeredBy_decorators, { kind: "field", name: "triggeredBy", static: false, private: false, access: { has: function (obj) { return "triggeredBy" in obj; }, get: function (obj) { return obj.triggeredBy; }, set: function (obj, value) { obj.triggeredBy = value; } }, metadata: _metadata }, _triggeredBy_initializers, _triggeredBy_extraInitializers);
        __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: function (obj) { return "timestamp" in obj; }, get: function (obj) { return obj.timestamp; }, set: function (obj, value) { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CameraSnapshotEntity = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CameraSnapshotEntity = _classThis;
}();
exports.CameraSnapshotEntity = CameraSnapshotEntity;
