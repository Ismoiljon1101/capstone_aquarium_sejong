"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagementController = void 0;
var common_1 = require("@nestjs/common");
var ManagementController = function () {
    var _classDecorators = [(0, common_1.Controller)('management')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _listFeed_decorators;
    var _createFeed_decorators;
    var _updateFeed_decorators;
    var _deleteFeed_decorators;
    var _getLight_decorators;
    var _updateLight_decorators;
    var _getConfig_decorators;
    var _updateConfig_decorators;
    var _markCleaned_decorators;
    var ManagementController = _classThis = /** @class */ (function () {
        function ManagementController_1(mgmt) {
            this.mgmt = (__runInitializers(this, _instanceExtraInitializers), mgmt);
        }
        // Feed schedules
        ManagementController_1.prototype.listFeed = function () { return this.mgmt.listFeedSchedules(); };
        ManagementController_1.prototype.createFeed = function (dto) { return this.mgmt.createFeedSchedule(dto); };
        ManagementController_1.prototype.updateFeed = function (id, dto) {
            return this.mgmt.updateFeedSchedule(id, dto);
        };
        ManagementController_1.prototype.deleteFeed = function (id) { return this.mgmt.deleteFeedSchedule(id); };
        // Light schedule
        ManagementController_1.prototype.getLight = function () { return this.mgmt.getLightSchedule(); };
        ManagementController_1.prototype.updateLight = function (dto) { return this.mgmt.updateLightSchedule(dto); };
        // Tank config
        ManagementController_1.prototype.getConfig = function () { return this.mgmt.getTankConfig(); };
        ManagementController_1.prototype.updateConfig = function (dto) { return this.mgmt.updateTankConfig(dto); };
        ManagementController_1.prototype.markCleaned = function () { return this.mgmt.markCleaned(); };
        return ManagementController_1;
    }());
    __setFunctionName(_classThis, "ManagementController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _listFeed_decorators = [(0, common_1.Get)('feed-schedules')];
        _createFeed_decorators = [(0, common_1.Post)('feed-schedules')];
        _updateFeed_decorators = [(0, common_1.Patch)('feed-schedules/:id')];
        _deleteFeed_decorators = [(0, common_1.Delete)('feed-schedules/:id')];
        _getLight_decorators = [(0, common_1.Get)('light-schedule')];
        _updateLight_decorators = [(0, common_1.Patch)('light-schedule')];
        _getConfig_decorators = [(0, common_1.Get)('tank-config')];
        _updateConfig_decorators = [(0, common_1.Patch)('tank-config')];
        _markCleaned_decorators = [(0, common_1.Post)('tank-config/mark-cleaned')];
        __esDecorate(_classThis, null, _listFeed_decorators, { kind: "method", name: "listFeed", static: false, private: false, access: { has: function (obj) { return "listFeed" in obj; }, get: function (obj) { return obj.listFeed; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createFeed_decorators, { kind: "method", name: "createFeed", static: false, private: false, access: { has: function (obj) { return "createFeed" in obj; }, get: function (obj) { return obj.createFeed; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateFeed_decorators, { kind: "method", name: "updateFeed", static: false, private: false, access: { has: function (obj) { return "updateFeed" in obj; }, get: function (obj) { return obj.updateFeed; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteFeed_decorators, { kind: "method", name: "deleteFeed", static: false, private: false, access: { has: function (obj) { return "deleteFeed" in obj; }, get: function (obj) { return obj.deleteFeed; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLight_decorators, { kind: "method", name: "getLight", static: false, private: false, access: { has: function (obj) { return "getLight" in obj; }, get: function (obj) { return obj.getLight; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateLight_decorators, { kind: "method", name: "updateLight", static: false, private: false, access: { has: function (obj) { return "updateLight" in obj; }, get: function (obj) { return obj.updateLight; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getConfig_decorators, { kind: "method", name: "getConfig", static: false, private: false, access: { has: function (obj) { return "getConfig" in obj; }, get: function (obj) { return obj.getConfig; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateConfig_decorators, { kind: "method", name: "updateConfig", static: false, private: false, access: { has: function (obj) { return "updateConfig" in obj; }, get: function (obj) { return obj.updateConfig; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _markCleaned_decorators, { kind: "method", name: "markCleaned", static: false, private: false, access: { has: function (obj) { return "markCleaned" in obj; }, get: function (obj) { return obj.markCleaned; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ManagementController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ManagementController = _classThis;
}();
exports.ManagementController = ManagementController;
