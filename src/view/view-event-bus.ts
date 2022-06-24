import { EventBus } from '@nestjs/cqrs/dist/event-bus';
import { Injectable, Logger } from '@nestjs/common';
import { IEvent, IEventBus } from '@nestjs/cqrs/dist/interfaces';
import { ViewUpdater } from './view-updater';

@Injectable()
export class ViewEventBus implements IEventBus {
  private logger = new Logger(ViewEventBus.name);

  constructor(private viewUpdater: ViewUpdater) {}

  async publish<T extends IEvent>(event: T): Promise<unknown> {
    this.logger.debug(
      `event published on the View Bus: ${event.constructor.name}`,
    );
    return await this.viewUpdater.run(event);
  }

  publishAll(events: IEvent[]): void {
    (events || []).forEach(async event => await this.publish(event));
  }
}
