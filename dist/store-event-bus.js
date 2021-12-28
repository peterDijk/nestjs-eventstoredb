"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreEventBus = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const cqrs_1 = require("@nestjs/cqrs");
const eventstore_1 = require("./eventstore");
const store_event_subscriber_1 = require("./store-event-subscriber");
const view_1 = require("./view");
let StoreEventBus = class StoreEventBus extends cqrs_1.EventBus {
    constructor(commandBus, moduleRef, eventStore, event$, viewEventsBus, streamPrefix, eventSerializers) {
        super(commandBus, moduleRef);
        this.eventStore = eventStore;
        this.event$ = event$;
        this.viewEventsBus = viewEventsBus;
        this.streamPrefix = streamPrefix;
        this.eventSerializers = eventSerializers;
    }
    onModuleInit() {
        return __awaiter(this, void 0, void 0, function* () {
            this.eventStore.setSerializers(this.streamPrefix, this.eventSerializers);
            const subscriber = new store_event_subscriber_1.EventStoreEventSubscriber(this.eventStore, this.viewEventsBus, this.streamPrefix);
            subscriber.bridgeEventsTo(this.event$.subject$);
            yield subscriber.getAll();
            subscriber.subscribe();
        });
    }
    publish(event) {
        const storableEvent = event;
        if (storableEvent.id === undefined ||
            storableEvent.eventVersion === undefined) {
            throw new Error('Events must implement StorableEvent interface');
        }
        this.eventStore.storeEvent(storableEvent, this.streamPrefix);
    }
    publishAll(events) {
        (events || []).forEach(event => this.publish(event));
    }
};
StoreEventBus = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        core_1.ModuleRef,
        eventstore_1.EventStore,
        cqrs_1.EventBus,
        view_1.ViewEventBus, String, Object])
], StoreEventBus);
exports.StoreEventBus = StoreEventBus;
