import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { IEvent, IEventBus } from '@nestjs/cqrs/dist/interfaces';
import { EventStore } from './eventstore';
import { EventSerializers, StorableEvent } from './interfaces';
import { StoreEventMetadataStorage } from './store-event-metadata.storage';
import { EventStoreEventSubscriber } from './store-event-subscriber';
import { ViewEventBus } from './view';

@Injectable()
export class StoreEventBus extends EventBus implements IEventBus {
  private logger = new Logger(StoreEventBus.name);

  constructor(
    commandBus: CommandBus,
    moduleRef: ModuleRef,
    private readonly eventStore: EventStore,
    private readonly event$: EventBus,
    private readonly viewEventsBus: ViewEventBus,
  ) {
    super(commandBus, moduleRef);
  }

  async onModuleInit(): Promise<void> {
    const aggregates = StoreEventMetadataStorage.getAggregates();
    const serializers = StoreEventMetadataStorage.getSerializers();

    aggregates.forEach(agg => {
      this.eventStore.setSerializers(agg, serializers[agg]);
      const subscriber = new EventStoreEventSubscriber(
        this.eventStore,
        this.viewEventsBus,
        agg,
      );
      subscriber.bridgeEventsTo(this.event$.subject$);
      subscriber.getAll(); // from checkpoint xxx comes later
      subscriber.subscribe();
    });
  }

  publish<T extends IEvent>(event: T): void {
    const storableEvent = event as any as StorableEvent;
    if (
      storableEvent.id === undefined ||
      storableEvent.eventVersion === undefined ||
      storableEvent.aggregateName === undefined
    ) {
      throw new Error('Events must implement StorableEvent interface');
    }
    this.eventStore.storeEvent(storableEvent, storableEvent.aggregateName);
  }

  publishAll(events: IEvent[]): void {
    (events || []).forEach(event => this.publish(event));
  }
}
