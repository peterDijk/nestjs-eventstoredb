import { Injectable, Logger } from '@nestjs/common';
import { IEvent, AggregateRoot } from '@nestjs/cqrs';
import { StoreEventBus } from './store-event-bus';

export interface Constructor<T> {
  new (...args: any[]): T;
}

@Injectable()
export class StoreEventPublisher {
  private logger = new Logger(StoreEventPublisher.name);

  constructor(private readonly eventBus: StoreEventBus) {}

  mergeClassContext<T extends Constructor<AggregateRoot>>(metatype: T): T {
    const eventBus = this.eventBus;
    return class extends metatype {
      publish(event: IEvent) {
        eventBus.publish(event);
      }

      publishAll(events: IEvent[]) {
        eventBus.publishAll(events);
      }
    };
  }

  mergeObjectContext<T extends AggregateRoot>(object: T): T {
    const eventBus = this.eventBus;
    object.publish = (event: IEvent) => {
      eventBus.publish(event);
    };

    object.publishAll = (events: IEvent[]) => {
      eventBus.publishAll(events);
    };
    return object;
  }
}
