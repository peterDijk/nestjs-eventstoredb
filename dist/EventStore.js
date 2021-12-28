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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStore = void 0;
const db_client_1 = require("@eventstore/db-client");
const common_1 = require("@nestjs/common");
class EventStore {
    constructor(options) {
        this.aggregateEventSerializers = {};
        this.eventStoreLaunched = false;
        this.logger = new common_1.Logger(EventStore.name);
        try {
            this.eventstore = db_client_1.EventStoreDBClient.connectionString(options.eventStoreUrl);
            this.eventStoreLaunched = true;
        }
        catch (err) {
            this.eventStoreLaunched = false;
        }
    }
    isInitiated() {
        return this.eventStoreLaunched;
    }
    setSerializers(aggregate, eventSerializers) {
        this.aggregateEventSerializers[aggregate] = eventSerializers;
    }
    getEvents(aggregate, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                var e_1, _a;
                var _b, _c;
                const events = [];
                let revision = db_client_1.NO_STREAM;
                const eventStream = yield this.eventstore.readStream(this.getAggregateId(aggregate, id));
                try {
                    for (var eventStream_1 = __asyncValues(eventStream), eventStream_1_1; eventStream_1_1 = yield eventStream_1.next(), !eventStream_1_1.done;) {
                        const resolvedEvent = eventStream_1_1.value;
                        revision = (_c = (_b = resolvedEvent.event) === null || _b === void 0 ? void 0 : _b.revision) !== null && _c !== void 0 ? _c : revision;
                        const parsedEvent = this.aggregateEventSerializers[aggregate][resolvedEvent.event.type](resolvedEvent.event.data);
                        events.push(parsedEvent);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (eventStream_1_1 && !eventStream_1_1.done && (_a = eventStream_1.return)) yield _a.call(eventStream_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                resolve({ events, lastRevision: revision });
            }));
        });
    }
    storeEvent(event, streamPrefix) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var e_2, _a;
                var _b;
                if (!this.eventStoreLaunched) {
                    reject('Event Store not launched!');
                    return;
                }
                const eventSerialized = JSON.stringify(event);
                const eventDeserialized = JSON.parse(eventSerialized);
                let revision = db_client_1.NO_STREAM;
                try {
                    const events = this.eventstore.readStream(this.getAggregateId(streamPrefix, eventDeserialized.id), {
                        fromRevision: db_client_1.START,
                        direction: db_client_1.FORWARDS,
                    });
                    try {
                        for (var events_1 = __asyncValues(events), events_1_1; events_1_1 = yield events_1.next(), !events_1_1.done;) {
                            const { event } = events_1_1.value;
                            revision = (_b = event === null || event === void 0 ? void 0 : event.revision) !== null && _b !== void 0 ? _b : revision;
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (events_1_1 && !events_1_1.done && (_a = events_1.return)) yield _a.call(events_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
                catch (err) { }
                yield this.eventstore.appendToStream(this.getAggregateId(streamPrefix, eventDeserialized.id), db_client_1.jsonEvent({
                    id: eventDeserialized.id,
                    type: eventDeserialized.eventName,
                    data: Object.assign({}, JSON.parse(eventSerialized)),
                }), { expectedRevision: revision });
            }));
        });
    }
    getAll(viewEventsBus, streamPrefix) {
        var e_3, _a;
        var _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log('Replaying all events to build projection');
            const events = this.eventstore.readAll();
            try {
                for (var events_2 = __asyncValues(events), events_2_1; events_2_1 = yield events_2.next(), !events_2_1.done;) {
                    const { event } = events_2_1.value;
                    const parsedEvent = (_c = (_b = this.aggregateEventSerializers[streamPrefix])[event.type]) === null || _c === void 0 ? void 0 : _c.call(_b, event.data);
                    if (parsedEvent) {
                        try {
                            yield viewEventsBus.publish(parsedEvent);
                        }
                        catch (err) {
                            throw Error('Error updating projection');
                        }
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (events_2_1 && !events_2_1.done && (_a = events_2.return)) yield _a.call(events_2);
                }
                finally { if (e_3) throw e_3.error; }
            }
            this.logger.log('Done parsing all past events to projection');
        });
    }
    subscribe(streamPrefix, bridge) {
        const filter = db_client_1.streamNameFilter({ prefixes: [streamPrefix] });
        const subscription = this.eventstore.subscribeToAll({
            filter,
            fromPosition: db_client_1.END,
        });
        subscription.on('data', data => {
            const parsedEvent = this.aggregateEventSerializers[streamPrefix][data.event.type](data.event.data);
            if (bridge) {
                bridge.next(parsedEvent);
            }
        });
        this.logger.log(`Subscribed to all streams with prefix '${streamPrefix}-'`);
    }
    getAggregateId(aggregate, id) {
        return aggregate + '-' + id;
    }
}
exports.EventStore = EventStore;
