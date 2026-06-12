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
exports.ManagementModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var management_service_1 = require("./management.service");
var management_controller_1 = require("./management.controller");
var scheduler_service_1 = require("./scheduler.service");
var feed_schedule_entity_1 = require("../database/entities/feed-schedule.entity");
var light_schedule_entity_1 = require("../database/entities/light-schedule.entity");
var tank_config_entity_1 = require("../database/entities/tank-config.entity");
var actuators_module_1 = require("../actuators/actuators.module");
var sensors_module_1 = require("../sensors/sensors.module");
var alerts_module_1 = require("../alerts/alerts.module");
var ManagementModule = function () {
    var _classDecorators = [(0, common_1.Module)({
            imports: [
                typeorm_1.TypeOrmModule.forFeature([feed_schedule_entity_1.FeedScheduleEntity, light_schedule_entity_1.LightScheduleEntity, tank_config_entity_1.TankConfigEntity]),
                actuators_module_1.ActuatorsModule,
                sensors_module_1.SensorsModule,
                alerts_module_1.AlertsModule,
            ],
            controllers: [management_controller_1.ManagementController],
            providers: [management_service_1.ManagementService, scheduler_service_1.SchedulerService],
            exports: [management_service_1.ManagementService],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ManagementModule = _classThis = /** @class */ (function () {
        function ManagementModule_1() {
        }
        return ManagementModule_1;
    }());
    __setFunctionName(_classThis, "ManagementModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ManagementModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ManagementModule = _classThis;
}();
exports.ManagementModule = ManagementModule;
