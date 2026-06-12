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
exports.UserCommandEntity = void 0;
var typeorm_1 = require("typeorm");
var UserCommandEntity = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('user_commands')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _commandId_decorators;
    var _commandId_initializers = [];
    var _commandId_extraInitializers = [];
    var _actuatorId_decorators;
    var _actuatorId_initializers = [];
    var _actuatorId_extraInitializers = [];
    var _commandType_decorators;
    var _commandType_initializers = [];
    var _commandType_extraInitializers = [];
    var _source_decorators;
    var _source_initializers = [];
    var _source_extraInitializers = [];
    var _payload_decorators;
    var _payload_initializers = [];
    var _payload_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _executedAt_decorators;
    var _executedAt_initializers = [];
    var _executedAt_extraInitializers = [];
    var UserCommandEntity = _classThis = /** @class */ (function () {
        function UserCommandEntity_1() {
            this.commandId = __runInitializers(this, _commandId_initializers, void 0);
            this.actuatorId = (__runInitializers(this, _commandId_extraInitializers), __runInitializers(this, _actuatorId_initializers, void 0));
            this.commandType = (__runInitializers(this, _actuatorId_extraInitializers), __runInitializers(this, _commandType_initializers, void 0));
            this.source = (__runInitializers(this, _commandType_extraInitializers), __runInitializers(this, _source_initializers, void 0)); // APP, CRON, AI
            this.payload = (__runInitializers(this, _source_extraInitializers), __runInitializers(this, _payload_initializers, void 0));
            this.createdAt = (__runInitializers(this, _payload_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.executedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _executedAt_initializers, void 0));
            __runInitializers(this, _executedAt_extraInitializers);
        }
        return UserCommandEntity_1;
    }());
    __setFunctionName(_classThis, "UserCommandEntity");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _commandId_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _actuatorId_decorators = [(0, typeorm_1.Column)()];
        _commandType_decorators = [(0, typeorm_1.Column)()];
        _source_decorators = [(0, typeorm_1.Column)()];
        _payload_decorators = [(0, typeorm_1.Column)('simple-json', { nullable: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _executedAt_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        __esDecorate(null, null, _commandId_decorators, { kind: "field", name: "commandId", static: false, private: false, access: { has: function (obj) { return "commandId" in obj; }, get: function (obj) { return obj.commandId; }, set: function (obj, value) { obj.commandId = value; } }, metadata: _metadata }, _commandId_initializers, _commandId_extraInitializers);
        __esDecorate(null, null, _actuatorId_decorators, { kind: "field", name: "actuatorId", static: false, private: false, access: { has: function (obj) { return "actuatorId" in obj; }, get: function (obj) { return obj.actuatorId; }, set: function (obj, value) { obj.actuatorId = value; } }, metadata: _metadata }, _actuatorId_initializers, _actuatorId_extraInitializers);
        __esDecorate(null, null, _commandType_decorators, { kind: "field", name: "commandType", static: false, private: false, access: { has: function (obj) { return "commandType" in obj; }, get: function (obj) { return obj.commandType; }, set: function (obj, value) { obj.commandType = value; } }, metadata: _metadata }, _commandType_initializers, _commandType_extraInitializers);
        __esDecorate(null, null, _source_decorators, { kind: "field", name: "source", static: false, private: false, access: { has: function (obj) { return "source" in obj; }, get: function (obj) { return obj.source; }, set: function (obj, value) { obj.source = value; } }, metadata: _metadata }, _source_initializers, _source_extraInitializers);
        __esDecorate(null, null, _payload_decorators, { kind: "field", name: "payload", static: false, private: false, access: { has: function (obj) { return "payload" in obj; }, get: function (obj) { return obj.payload; }, set: function (obj, value) { obj.payload = value; } }, metadata: _metadata }, _payload_initializers, _payload_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _executedAt_decorators, { kind: "field", name: "executedAt", static: false, private: false, access: { has: function (obj) { return "executedAt" in obj; }, get: function (obj) { return obj.executedAt; }, set: function (obj, value) { obj.executedAt = value; } }, metadata: _metadata }, _executedAt_initializers, _executedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UserCommandEntity = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UserCommandEntity = _classThis;
}();
exports.UserCommandEntity = UserCommandEntity;
