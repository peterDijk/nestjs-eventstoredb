"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
var EventStoreModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStoreModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const core_1 = require("@nestjs/core");
const store_event_subscriber_1 = require("./store-event-subscriber");
const eventStore_1 = require("./eventStore");
const view_1 = require("./view");
const store_event_bus_1 = require("./store-event-bus");
const store_event_publisher_1 = require("./store-event-publisher");
let EventStoreModule = EventStoreModule_1 = class EventStoreModule {
    static forRoot(options) {
        return {
            module: EventStoreModule_1,
            providers: [
                {
                    provide: eventStore_1.EventStore,
                    useValue: new eventStore_1.EventStore(options),
                },
            ],
            exports: [eventStore_1.EventStore],
            global: true,
        };
    }
    static forFeature(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                module: EventStoreModule_1,
                imports: [cqrs_1.CqrsModule],
                providers: [
                    view_1.ViewUpdater,
                    view_1.ViewEventBus,
                    {
                        provide: store_event_bus_1.StoreEventBus,
                        useFactory: (commandBus, moduleRef, eventStore, event$, viewEventsBus) => {
                            return new store_event_bus_1.StoreEventBus(commandBus, moduleRef, eventStore, event$, viewEventsBus, options.streamPrefix, options.eventSerializers);
                        },
                        inject: [cqrs_1.CommandBus, core_1.ModuleRef, eventStore_1.EventStore, cqrs_1.EventBus, view_1.ViewEventBus],
                    },
                    store_event_publisher_1.StoreEventPublisher,
                ],
                exports: [view_1.ViewUpdater, view_1.ViewEventBus, store_event_bus_1.StoreEventBus, store_event_publisher_1.StoreEventPublisher],
            };
        });
    }
};
EventStoreModule = EventStoreModule_1 = __decorate([
    common_1.Module({
        imports: [cqrs_1.CqrsModule],
        providers: [store_event_subscriber_1.EventStoreEventSubscriber],
    })
], EventStoreModule);
exports.EventStoreModule = EventStoreModule;
