import { Module, DynamicModule, Logger } from '@nestjs/common';
import { CommandBus, CqrsModule, EventBus } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { EventStoreEventSubscriber } from './store-event-subscriber';
import { EventSerializers, EventSourcingOptions } from './interfaces';
import { EventStore } from './eventStore';
import { ViewEventBus, ViewUpdater } from './view';
import { StoreEventBus } from './store-event-bus';
import { StoreEventPublisher } from './store-event-publisher';

@Module({
  imports: [CqrsModule],
  providers: [EventStoreEventSubscriber], // needed??
})
export class EventStoreModule {
  static forRoot(options: EventSourcingOptions): DynamicModule {
    return {
      module: EventStoreModule,
      providers: [
        {
          provide: EventStore,
          useValue: new EventStore(options),
        },
      ],
      exports: [EventStore],
      global: true,
    };
  }

  static async forFeature(options: {
    streamPrefix: string;
    eventSerializers: EventSerializers;
  }): Promise<DynamicModule> {
    return {
      module: EventStoreModule,
      imports: [CqrsModule],
      providers: [
        ViewUpdater,
        ViewEventBus,
        {
          provide: StoreEventBus,
          useFactory: (
            commandBus: CommandBus,
            moduleRef: ModuleRef,
            eventStore: EventStore,
            event$: EventBus,
            viewEventsBus: ViewEventBus,
          ) => {
            return new StoreEventBus(
              commandBus,
              moduleRef,
              eventStore,
              event$,
              viewEventsBus,
              options.streamPrefix,
              options.eventSerializers,
            );
          },
          inject: [CommandBus, ModuleRef, EventStore, EventBus, ViewEventBus],
        },
        StoreEventPublisher,
        // AggregateRepository,
      ],
      exports: [ViewUpdater, ViewEventBus, StoreEventBus, StoreEventPublisher],
    };
  }
}
