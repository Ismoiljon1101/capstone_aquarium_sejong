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
exports.VoiceModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var axios_1 = require("@nestjs/axios");
var config_1 = require("@nestjs/config");
var voice_controller_1 = require("./voice.controller");
var voice_service_1 = require("./voice.service");
var agent_service_1 = require("./agent.service");
var agent_monitor_1 = require("./agent.monitor");
var voice_session_entity_1 = require("../database/entities/voice-session.entity");
var chat_message_entity_1 = require("../database/entities/chat-message.entity");
var sensors_module_1 = require("../sensors/sensors.module");
var vision_module_1 = require("../vision/vision.module");
var actuators_module_1 = require("../actuators/actuators.module");
var management_module_1 = require("../management/management.module");
var fish_module_1 = require("../fish/fish.module");
var VoiceModule = function () {
    var _classDecorators = [(0, common_1.Module)({
            imports: [
                axios_1.HttpModule,
                config_1.ConfigModule,
                typeorm_1.TypeOrmModule.forFeature([voice_session_entity_1.VoiceSessionEntity, chat_message_entity_1.ChatMessageEntity]),
                sensors_module_1.SensorsModule,
                vision_module_1.VisionModule,
                actuators_module_1.ActuatorsModule,
                management_module_1.ManagementModule,
                fish_module_1.FishModule,
            ],
            controllers: [voice_controller_1.VoiceController],
            providers: [voice_service_1.VoiceService, agent_service_1.AgentService, agent_monitor_1.AgentMonitorService],
            exports: [voice_service_1.VoiceService, agent_service_1.AgentService],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var VoiceModule = _classThis = /** @class */ (function () {
        function VoiceModule_1() {
        }
        return VoiceModule_1;
    }());
    __setFunctionName(_classThis, "VoiceModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VoiceModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VoiceModule = _classThis;
}();
exports.VoiceModule = VoiceModule;
