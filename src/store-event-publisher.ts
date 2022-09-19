import { Injectable, Logger } from '@nestjs/common';
import { IEvent, AggregateRoot } from '@nestjs/cqrs';
import { StoreEventBus } from './store-event-bus';

export interface Constructor<T> {
  new (...args: any[]): T;
}

@Injectable()
export class StoreEventPublisher {
  private logger = new Logger(StoreEventBus.name);

  constructor(private readonly eventBus: StoreEventBus) {
    this.logger.debug('constructed');
  }

  mergeClassContext<T extends Constructor<AggregateRoot>>(metatype: T): T {
    const eventBus = this.eventBus;
    return class extends metatype {
      publish(event: IEvent) {
        eventBus.publish(event);
      }
    };
  }

  mergeObjectContext<T extends AggregateRoot>(object: T): T {
    this.logger.log('mergeObjectContext');
    const eventBus = this.eventBus;
    object.publish = (event: IEvent) => {
      this.logger.log(`on to eventBus: ${event}`);
      eventBus.publish(event);
    };
    return object;
  }
}
