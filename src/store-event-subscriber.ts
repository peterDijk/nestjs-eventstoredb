import { IEvent, IMessageSource } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { EventStoreDBClient } from '@eventstore/db-client';
import { Logger } from '@nestjs/common';
import { EventStore } from './eventstore';
import { ViewEventBus } from './view';

export class EventStoreEventSubscriber implements IMessageSource {
  private logger = new Logger(EventStoreEventSubscriber.name);

  constructor(
    private readonly eventStore: EventStore,
    private readonly viewEventBus: ViewEventBus,
    private readonly streamPrefix: string,
  ) {}

  async getAll(): Promise<void> {
    await this.eventStore.getAll(this.streamPrefix);
    // TODO: getAll now gets all events for all streams for every stream!
  }

  subscribe(): void {
    this.eventStore.subscribe(this.streamPrefix);
  }

  bridgeEventsTo<T extends IEvent>(subject: Subject<T>): void {}
}
