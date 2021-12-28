"use strict";
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
exports.EventStoreEventSubscriber = void 0;
const common_1 = require("@nestjs/common");
class EventStoreEventSubscriber {
    constructor(eventStore, viewEventsBus, streamPrefix) {
        this.eventStore = eventStore;
        this.viewEventsBus = viewEventsBus;
        this.streamPrefix = streamPrefix;
        this.isConnected = false;
        this.hasBridge = false;
        this.logger = new common_1.Logger(EventStoreEventSubscriber.name);
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.eventStore.getAll(this.viewEventsBus, this.streamPrefix);
        });
    }
    subscribe() {
        if (this.bridge) {
            this.eventStore.subscribe(this.streamPrefix, this.bridge);
        }
    }
    bridgeEventsTo(subject) {
        this.bridge = subject;
    }
}
exports.EventStoreEventSubscriber = EventStoreEventSubscriber;
