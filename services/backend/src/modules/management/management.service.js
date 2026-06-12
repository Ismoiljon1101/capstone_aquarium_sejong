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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagementService = void 0;
var common_1 = require("@nestjs/common");
var ManagementService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ManagementService = _classThis = /** @class */ (function () {
        function ManagementService_1(feedRepo, lightRepo, configRepo) {
            this.feedRepo = feedRepo;
            this.lightRepo = lightRepo;
            this.configRepo = configRepo;
            this.logger = new common_1.Logger(ManagementService.name);
        }
        // ── Feed schedules ────────────────────────────────────────────────────────
        ManagementService_1.prototype.listFeedSchedules = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.feedRepo.find({ order: { time: 'ASC' } })];
                });
            });
        };
        ManagementService_1.prototype.createFeedSchedule = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var entity;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    entity = this.feedRepo.create({
                        time: (_a = dto.time) !== null && _a !== void 0 ? _a : '08:00',
                        daysMask: (_b = dto.daysMask) !== null && _b !== void 0 ? _b : 127,
                        portionSec: (_c = dto.portionSec) !== null && _c !== void 0 ? _c : 3,
                        enabled: (_d = dto.enabled) !== null && _d !== void 0 ? _d : true,
                    });
                    return [2 /*return*/, this.feedRepo.save(entity)];
                });
            });
        };
        ManagementService_1.prototype.updateFeedSchedule = function (id, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var existing;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.feedRepo.findOne({ where: { id: id } })];
                        case 1:
                            existing = _a.sent();
                            if (!existing)
                                throw new common_1.NotFoundException("feed schedule ".concat(id, " not found"));
                            Object.assign(existing, dto);
                            return [2 /*return*/, this.feedRepo.save(existing)];
                    }
                });
            });
        };
        ManagementService_1.prototype.deleteFeedSchedule = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.feedRepo.delete(id)];
                        case 1:
                            result = _b.sent();
                            return [2 /*return*/, { deleted: (_a = result.affected) !== null && _a !== void 0 ? _a : 0 }];
                    }
                });
            });
        };
        // ── Light schedule (singleton) ────────────────────────────────────────────
        ManagementService_1.prototype.getLightSchedule = function () {
            return __awaiter(this, void 0, void 0, function () {
                var row, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.lightRepo.findOne({ where: { id: 1 } })];
                        case 1:
                            row = _b.sent();
                            if (row)
                                return [2 /*return*/, row];
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 6]);
                            return [4 /*yield*/, this.lightRepo.save(this.lightRepo.create({ id: 1 }))];
                        case 3:
                            row = _b.sent();
                            return [3 /*break*/, 6];
                        case 4:
                            _a = _b.sent();
                            return [4 /*yield*/, this.lightRepo.findOne({ where: { id: 1 } })];
                        case 5:
                            // Race with another caller that just inserted id=1 — re-fetch
                            row = _b.sent();
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/, row];
                    }
                });
            });
        };
        ManagementService_1.prototype.updateLightSchedule = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var row;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getLightSchedule()];
                        case 1:
                            row = _a.sent();
                            Object.assign(row, dto);
                            return [2 /*return*/, this.lightRepo.save(row)];
                    }
                });
            });
        };
        // ── Tank config (singleton) ───────────────────────────────────────────────
        ManagementService_1.prototype.getTankConfig = function () {
            return __awaiter(this, void 0, void 0, function () {
                var row, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.configRepo.findOne({ where: { id: 1 } })];
                        case 1:
                            row = _b.sent();
                            if (row)
                                return [2 /*return*/, row];
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 6]);
                            return [4 /*yield*/, this.configRepo.save(this.configRepo.create({ id: 1 }))];
                        case 3:
                            row = _b.sent();
                            return [3 /*break*/, 6];
                        case 4:
                            _a = _b.sent();
                            return [4 /*yield*/, this.configRepo.findOne({ where: { id: 1 } })];
                        case 5:
                            // Race with another caller — re-fetch
                            row = _b.sent();
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/, row];
                    }
                });
            });
        };
        ManagementService_1.prototype.updateTankConfig = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var row;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getTankConfig()];
                        case 1:
                            row = _a.sent();
                            Object.assign(row, dto);
                            return [2 /*return*/, this.configRepo.save(row)];
                    }
                });
            });
        };
        ManagementService_1.prototype.markCleaned = function () {
            return __awaiter(this, void 0, void 0, function () {
                var row;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getTankConfig()];
                        case 1:
                            row = _a.sent();
                            row.lastCleanedAt = new Date();
                            return [2 /*return*/, this.configRepo.save(row)];
                    }
                });
            });
        };
        /** Helper for SchedulerService */
        ManagementService_1.prototype.markFeedFired = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.feedRepo.update(id, { lastFiredAt: new Date() })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return ManagementService_1;
    }());
    __setFunctionName(_classThis, "ManagementService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ManagementService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ManagementService = _classThis;
}();
exports.ManagementService = ManagementService;
