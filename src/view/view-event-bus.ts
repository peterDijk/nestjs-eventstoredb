import { EventBus } from '@nestjs/cqrs/dist/event-bus';
import { Injectable } from '@nestjs/common';
import { IEvent, IEventBus } from '@nestjs/cqrs/dist/interfaces';
import { ViewUpdater } from './view-updater';

@Injectable()
export class ViewEventBus implements IEventBus {
  constructor(
    private readonly eventBus: EventBus,
    private viewUpdater: ViewUpdater,
  ) {}

  async publish<T extends IEvent>(event: T): Promise<unknown> {
    return await this.viewUpdater.run(event);
  }

  publishAll(events: IEvent[]): void {
    (events || []).forEach(async event => await this.publish(event));
  }
}
