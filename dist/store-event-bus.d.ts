import { ModuleRef } from '@nestjs/core';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { IEvent, IEventBus } from '@nestjs/cqrs/dist/interfaces';
import { EventStore } from './eventstore';
import { EventSerializers } from './interfaces';
import { ViewEventBus } from './view';
export declare class StoreEventBus extends EventBus implements IEventBus {
    private readonly eventStore;
    private readonly event$;
    private readonly viewEventsBus;
    streamPrefix: string;
    eventSerializers: EventSerializers;
    constructor(commandBus: CommandBus, moduleRef: ModuleRef, eventStore: EventStore, event$: EventBus, viewEventsBus: ViewEventBus, streamPrefix: string, eventSerializers: EventSerializers);
    onModuleInit(): Promise<void>;
    publish<T extends IEvent>(event: T): void;
    publishAll(events: IEvent[]): void;
}
