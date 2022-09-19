import { Module, DynamicModule, Logger } from '@nestjs/common';
import { CommandBus, CqrsModule, EventBus } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { EventStoreEventSubscriber } from './store-event-subscriber';
import { EventSerializers, EventStoreOptions } from './interfaces';
import { EventStore } from './eventstore';
import { ViewEventBus, ViewUpdater } from './view';
import { StoreEventBus } from './store-event-bus';
import { StoreEventPublisher } from './store-event-publisher';
import { StoreEventMetadataStorage } from './store-event-metadata.storage';
import { streamNameFilter } from '@eventstore/db-client';

@Module({
  imports: [CqrsModule],
  providers: [EventStoreEventSubscriber],
})
export class EventStoreModule {
  static forRoot(options: EventStoreOptions): DynamicModule {
    Logger.debug(`LOCAL`);
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

  private logger = new Logger(EventStoreModule.name);

  static async forFeature(options: {
    streamPrefix: string;
    eventSerializers: EventSerializers;
  }): Promise<DynamicModule> {
    StoreEventMetadataStorage.addAggregateAndSerializers(
      options.streamPrefix,
      options.eventSerializers,
    );

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
            );
          },
          inject: [CommandBus, ModuleRef, EventStore, EventBus, ViewEventBus],
        },
        StoreEventPublisher,
      ],
      exports: [ViewUpdater, ViewEventBus, StoreEventBus, StoreEventPublisher],
    };
  }
}
