import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { IEvent, IEventBus } from '@nestjs/cqrs/dist/interfaces';
import { EventStore } from './eventstore';
import { EventSerializers, StorableEvent } from './interfaces';
import { EventStoreEventSubscriber } from './store-event-subscriber';
import { ViewEventBus } from './view';

@Injectable()
export class StoreEventBus extends EventBus implements IEventBus {
  public streamPrefix: string;
  public eventSerializers: EventSerializers;
  private logger = new Logger(StoreEventBus.name);

  constructor(
    commandBus: CommandBus,
    moduleRef: ModuleRef,
    private readonly eventStore: EventStore,
    private readonly event$: EventBus,
    private readonly viewEventsBus: ViewEventBus,
    streamPrefix: string,
    eventSerializers: EventSerializers,
  ) {
    super(commandBus, moduleRef);
    this.streamPrefix = streamPrefix;
    this.eventSerializers = eventSerializers;
    this.logger.debug({ streamPrefix });
  }

  async onModuleInit() {
    this.logger.debug(`onModuleInit`);
    this.eventStore.setSerializers(this.streamPrefix, this.eventSerializers);
    const subscriber = new EventStoreEventSubscriber(
      this.eventStore,
      this.viewEventsBus,
      this.streamPrefix,
    );
    subscriber.bridgeEventsTo(this.event$.subject$);
    await subscriber.getAll(); // from checkpoint xxx comes later
    subscriber.subscribe();
  }

  publish<T extends IEvent>(event: T): void {
    const storableEvent = event as any as StorableEvent;
    if (
      storableEvent.id === undefined ||
      storableEvent.eventVersion === undefined
    ) {
      throw new Error('Events must implement StorableEvent interface');
    }
    this.eventStore.storeEvent(storableEvent, this.streamPrefix);
  }

  publishAll(events: IEvent[]): void {
    (events || []).forEach(event => this.publish(event));
  }
}
