import { EventSerializers, EventSourcingOptions } from './interfaces';
import { AppendExpectedRevision } from '@eventstore/db-client';
import { IEvent } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { ViewEventBus } from './view';
export declare class EventStore {
    private readonly eventstore;
    private aggregateEventSerializers;
    private readonly config;
    eventStoreLaunched: boolean;
    private logger;
    constructor(options: EventSourcingOptions);
    isInitiated(): boolean;
    setSerializers(aggregate: string, eventSerializers: EventSerializers): void;
    getEvents(aggregate: string, id: string): Promise<{
        events: IEvent[];
        snapshot?: any;
        lastRevision: AppendExpectedRevision;
    }>;
    storeEvent<T extends IEvent>(event: T, streamPrefix: string): Promise<void>;
    getAll(viewEventsBus: ViewEventBus, streamPrefix: string): Promise<void>;
    subscribe(streamPrefix: string, bridge: Subject<any>): void;
    private getAggregateId;
}
