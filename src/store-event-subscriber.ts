import { IEvent, IMessageSource } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { EventStoreDBClient } from '@eventstore/db-client';
import { Logger } from '@nestjs/common';
import { EventStore } from './eventstore';
import { ViewEventBus } from './view';

export class EventStoreEventSubscriber implements IMessageSource {
  private client: EventStoreDBClient;
  private bridge: Subject<any>;
  public isConnected = false;
  public hasBridge = false;

  private logger = new Logger(EventStoreEventSubscriber.name);

  constructor(
    private readonly eventStore: EventStore,
    private readonly viewEventsBus: ViewEventBus,
    private readonly streamPrefix: string,
  ) {}

  async getAll() {
    await this.eventStore.getAll(this.viewEventsBus, this.streamPrefix);
  }

  subscribe() {
    if (this.bridge) {
      this.eventStore.subscribe(this.streamPrefix, this.bridge);
    }
  }

  bridgeEventsTo<T extends IEvent>(subject: Subject<T>) {
    this.bridge = subject;
  }
}
