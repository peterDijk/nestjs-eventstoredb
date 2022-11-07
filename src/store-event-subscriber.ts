import { IEvent, IMessageSource } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { EventStoreDBClient } from '@eventstore/db-client';
import { Logger } from '@nestjs/common';
import { EventStore } from './eventstore';
import { ViewEventBus } from './view';

export class EventStoreEventSubscriber implements IMessageSource {
  private client: EventStoreDBClient;
  // private bridge: Subject<any>;
  public hasBridge = false;

  private logger = new Logger(EventStoreEventSubscriber.name);

  constructor(
    private readonly eventStore: EventStore,
    private readonly viewEventBus: ViewEventBus,
    private readonly streamPrefix: string,
  ) {}

  async getAll(): Promise<void> {
    await this.eventStore.getAll(this.viewEventBus, this.streamPrefix);
    // TODO: getAll now gets all events for all streams for every stream!
  }

  subscribe(): void {
    // if (this.bridge) {
    this.eventStore.subscribe(
      this.streamPrefix,
      // this.bridge,
      this.viewEventBus,
    );
    // }
  }

  bridgeEventsTo<T extends IEvent>(subject: Subject<T>): void {
    // this.bridge = subject;
  }
}
