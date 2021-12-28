import { IEvent, IMessageSource } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { EventStore } from './EventStore';
import { ViewEventBus } from './view';
export declare class EventStoreEventSubscriber implements IMessageSource {
    private readonly eventStore;
    private readonly viewEventsBus;
    private readonly streamPrefix;
    private client;
    private bridge;
    isConnected: boolean;
    hasBridge: boolean;
    private logger;
    constructor(eventStore: EventStore, viewEventsBus: ViewEventBus, streamPrefix: string);
    getAll(): Promise<void>;
    subscribe(): void;
    bridgeEventsTo<T extends IEvent>(subject: Subject<T>): void;
}
