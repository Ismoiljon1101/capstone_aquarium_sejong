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
exports.HealthReport = void 0;
var typeorm_1 = require("typeorm");
var HealthReport = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('health_reports')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _reportId_decorators;
    var _reportId_initializers = [];
    var _reportId_extraInitializers = [];
    var _snapshotId_decorators;
    var _snapshotId_initializers = [];
    var _snapshotId_extraInitializers = [];
    var _phStatus_decorators;
    var _phStatus_initializers = [];
    var _phStatus_extraInitializers = [];
    var _tempStatus_decorators;
    var _tempStatus_initializers = [];
    var _tempStatus_extraInitializers = [];
    var _doStatus_decorators;
    var _doStatus_initializers = [];
    var _doStatus_extraInitializers = [];
    var _visualStatus_decorators;
    var _visualStatus_initializers = [];
    var _visualStatus_extraInitializers = [];
    var _behaviorStatus_decorators;
    var _behaviorStatus_initializers = [];
    var _behaviorStatus_extraInitializers = [];
    var _behaviorLabel_decorators;
    var _behaviorLabel_initializers = [];
    var _behaviorLabel_extraInitializers = [];
    var _behaviorConfidence_decorators;
    var _behaviorConfidence_initializers = [];
    var _behaviorConfidence_extraInitializers = [];
    var _overallScore_decorators;
    var _overallScore_initializers = [];
    var _overallScore_extraInitializers = [];
    var _summary_decorators;
    var _summary_initializers = [];
    var _summary_extraInitializers = [];
    var _diseaseClass_decorators;
    var _diseaseClass_initializers = [];
    var _diseaseClass_extraInitializers = [];
    var _mlConfidence_decorators;
    var _mlConfidence_initializers = [];
    var _mlConfidence_extraInitializers = [];
    var _severity_decorators;
    var _severity_initializers = [];
    var _severity_extraInitializers = [];
    var _fishId_decorators;
    var _fishId_initializers = [];
    var _fishId_extraInitializers = [];
    var _source_decorators;
    var _source_initializers = [];
    var _source_extraInitializers = [];
    var _timestamp_decorators;
    var _timestamp_initializers = [];
    var _timestamp_extraInitializers = [];
    var HealthReport = _classThis = /** @class */ (function () {
        function HealthReport_1() {
            this.reportId = __runInitializers(this, _reportId_initializers, void 0);
            this.snapshotId = (__runInitializers(this, _reportId_extraInitializers), __runInitializers(this, _snapshotId_initializers, void 0));
            this.phStatus = (__runInitializers(this, _snapshotId_extraInitializers), __runInitializers(this, _phStatus_initializers, void 0));
            this.tempStatus = (__runInitializers(this, _phStatus_extraInitializers), __runInitializers(this, _tempStatus_initializers, void 0));
            this.doStatus = (__runInitializers(this, _tempStatus_extraInitializers), __runInitializers(this, _doStatus_initializers, void 0));
            this.visualStatus = (__runInitializers(this, _doStatus_extraInitializers), __runInitializers(this, _visualStatus_initializers, void 0));
            this.behaviorStatus = (__runInitializers(this, _visualStatus_extraInitializers), __runInitializers(this, _behaviorStatus_initializers, void 0));
            this.behaviorLabel = (__runInitializers(this, _behaviorStatus_extraInitializers), __runInitializers(this, _behaviorLabel_initializers, void 0));
            this.behaviorConfidence = (__runInitializers(this, _behaviorLabel_extraInitializers), __runInitializers(this, _behaviorConfidence_initializers, void 0));
            this.overallScore = (__runInitializers(this, _behaviorConfidence_extraInitializers), __runInitializers(this, _overallScore_initializers, void 0));
            this.summary = (__runInitializers(this, _overallScore_extraInitializers), __runInitializers(this, _summary_initializers, void 0));
            // ML model fields (populated by Maral's Python scripts via POST /fish/diagnosis)
            this.diseaseClass = (__runInitializers(this, _summary_extraInitializers), __runInitializers(this, _diseaseClass_initializers, void 0));
            this.mlConfidence = (__runInitializers(this, _diseaseClass_extraInitializers), __runInitializers(this, _mlConfidence_initializers, void 0));
            this.severity = (__runInitializers(this, _mlConfidence_extraInitializers), __runInitializers(this, _severity_initializers, void 0));
            this.fishId = (__runInitializers(this, _severity_extraInitializers), __runInitializers(this, _fishId_initializers, void 0));
            this.source = (__runInitializers(this, _fishId_extraInitializers), __runInitializers(this, _source_initializers, void 0)); // 'manual' | 'ml_model'
            this.timestamp = (__runInitializers(this, _source_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0));
            __runInitializers(this, _timestamp_extraInitializers);
        }
        return HealthReport_1;
    }());
    __setFunctionName(_classThis, "HealthReport");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _reportId_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _snapshotId_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _phStatus_decorators = [(0, typeorm_1.Column)({ default: 'ok' })];
        _tempStatus_decorators = [(0, typeorm_1.Column)({ default: 'ok' })];
        _doStatus_decorators = [(0, typeorm_1.Column)({ default: 'ok' })];
        _visualStatus_decorators = [(0, typeorm_1.Column)({ default: 'ok' })];
        _behaviorStatus_decorators = [(0, typeorm_1.Column)({ default: 'ok' })];
        _behaviorLabel_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _behaviorConfidence_decorators = [(0, typeorm_1.Column)('float', { nullable: true })];
        _overallScore_decorators = [(0, typeorm_1.Column)('float', { default: 1.0 })];
        _summary_decorators = [(0, typeorm_1.Column)('text', { default: '' })];
        _diseaseClass_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _mlConfidence_decorators = [(0, typeorm_1.Column)('float', { nullable: true })];
        _severity_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _fishId_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _source_decorators = [(0, typeorm_1.Column)({ default: 'manual' })];
        _timestamp_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _reportId_decorators, { kind: "field", name: "reportId", static: false, private: false, access: { has: function (obj) { return "reportId" in obj; }, get: function (obj) { return obj.reportId; }, set: function (obj, value) { obj.reportId = value; } }, metadata: _metadata }, _reportId_initializers, _reportId_extraInitializers);
        __esDecorate(null, null, _snapshotId_decorators, { kind: "field", name: "snapshotId", static: false, private: false, access: { has: function (obj) { return "snapshotId" in obj; }, get: function (obj) { return obj.snapshotId; }, set: function (obj, value) { obj.snapshotId = value; } }, metadata: _metadata }, _snapshotId_initializers, _snapshotId_extraInitializers);
        __esDecorate(null, null, _phStatus_decorators, { kind: "field", name: "phStatus", static: false, private: false, access: { has: function (obj) { return "phStatus" in obj; }, get: function (obj) { return obj.phStatus; }, set: function (obj, value) { obj.phStatus = value; } }, metadata: _metadata }, _phStatus_initializers, _phStatus_extraInitializers);
        __esDecorate(null, null, _tempStatus_decorators, { kind: "field", name: "tempStatus", static: false, private: false, access: { has: function (obj) { return "tempStatus" in obj; }, get: function (obj) { return obj.tempStatus; }, set: function (obj, value) { obj.tempStatus = value; } }, metadata: _metadata }, _tempStatus_initializers, _tempStatus_extraInitializers);
        __esDecorate(null, null, _doStatus_decorators, { kind: "field", name: "doStatus", static: false, private: false, access: { has: function (obj) { return "doStatus" in obj; }, get: function (obj) { return obj.doStatus; }, set: function (obj, value) { obj.doStatus = value; } }, metadata: _metadata }, _doStatus_initializers, _doStatus_extraInitializers);
        __esDecorate(null, null, _visualStatus_decorators, { kind: "field", name: "visualStatus", static: false, private: false, access: { has: function (obj) { return "visualStatus" in obj; }, get: function (obj) { return obj.visualStatus; }, set: function (obj, value) { obj.visualStatus = value; } }, metadata: _metadata }, _visualStatus_initializers, _visualStatus_extraInitializers);
        __esDecorate(null, null, _behaviorStatus_decorators, { kind: "field", name: "behaviorStatus", static: false, private: false, access: { has: function (obj) { return "behaviorStatus" in obj; }, get: function (obj) { return obj.behaviorStatus; }, set: function (obj, value) { obj.behaviorStatus = value; } }, metadata: _metadata }, _behaviorStatus_initializers, _behaviorStatus_extraInitializers);
        __esDecorate(null, null, _behaviorLabel_decorators, { kind: "field", name: "behaviorLabel", static: false, private: false, access: { has: function (obj) { return "behaviorLabel" in obj; }, get: function (obj) { return obj.behaviorLabel; }, set: function (obj, value) { obj.behaviorLabel = value; } }, metadata: _metadata }, _behaviorLabel_initializers, _behaviorLabel_extraInitializers);
        __esDecorate(null, null, _behaviorConfidence_decorators, { kind: "field", name: "behaviorConfidence", static: false, private: false, access: { has: function (obj) { return "behaviorConfidence" in obj; }, get: function (obj) { return obj.behaviorConfidence; }, set: function (obj, value) { obj.behaviorConfidence = value; } }, metadata: _metadata }, _behaviorConfidence_initializers, _behaviorConfidence_extraInitializers);
        __esDecorate(null, null, _overallScore_decorators, { kind: "field", name: "overallScore", static: false, private: false, access: { has: function (obj) { return "overallScore" in obj; }, get: function (obj) { return obj.overallScore; }, set: function (obj, value) { obj.overallScore = value; } }, metadata: _metadata }, _overallScore_initializers, _overallScore_extraInitializers);
        __esDecorate(null, null, _summary_decorators, { kind: "field", name: "summary", static: false, private: false, access: { has: function (obj) { return "summary" in obj; }, get: function (obj) { return obj.summary; }, set: function (obj, value) { obj.summary = value; } }, metadata: _metadata }, _summary_initializers, _summary_extraInitializers);
        __esDecorate(null, null, _diseaseClass_decorators, { kind: "field", name: "diseaseClass", static: false, private: false, access: { has: function (obj) { return "diseaseClass" in obj; }, get: function (obj) { return obj.diseaseClass; }, set: function (obj, value) { obj.diseaseClass = value; } }, metadata: _metadata }, _diseaseClass_initializers, _diseaseClass_extraInitializers);
        __esDecorate(null, null, _mlConfidence_decorators, { kind: "field", name: "mlConfidence", static: false, private: false, access: { has: function (obj) { return "mlConfidence" in obj; }, get: function (obj) { return obj.mlConfidence; }, set: function (obj, value) { obj.mlConfidence = value; } }, metadata: _metadata }, _mlConfidence_initializers, _mlConfidence_extraInitializers);
        __esDecorate(null, null, _severity_decorators, { kind: "field", name: "severity", static: false, private: false, access: { has: function (obj) { return "severity" in obj; }, get: function (obj) { return obj.severity; }, set: function (obj, value) { obj.severity = value; } }, metadata: _metadata }, _severity_initializers, _severity_extraInitializers);
        __esDecorate(null, null, _fishId_decorators, { kind: "field", name: "fishId", static: false, private: false, access: { has: function (obj) { return "fishId" in obj; }, get: function (obj) { return obj.fishId; }, set: function (obj, value) { obj.fishId = value; } }, metadata: _metadata }, _fishId_initializers, _fishId_extraInitializers);
        __esDecorate(null, null, _source_decorators, { kind: "field", name: "source", static: false, private: false, access: { has: function (obj) { return "source" in obj; }, get: function (obj) { return obj.source; }, set: function (obj, value) { obj.source = value; } }, metadata: _metadata }, _source_initializers, _source_extraInitializers);
        __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: function (obj) { return "timestamp" in obj; }, get: function (obj) { return obj.timestamp; }, set: function (obj, value) { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        HealthReport = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return HealthReport = _classThis;
}();
exports.HealthReport = HealthReport;
