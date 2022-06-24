import { Injectable, Type, Logger } from '@nestjs/common';
import { IViewUpdater } from './interfaces/view-updater';
import { IEvent } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { ViewUpdaters } from './view-updaters';

@Injectable()
export class ViewUpdater {
  private instances = new Map<
    Type<IViewUpdater<IEvent>>,
    IViewUpdater<IEvent>
  >();
  private logger = new Logger(ViewUpdater.name);

  constructor(private moduleRef: ModuleRef) {}

  async run<T extends IEvent>(event: T): Promise<void> {
    const updater = ViewUpdaters.get(event.constructor.name);
    if (updater) {
      if (!this.instances.has(updater)) {
        this.instances.set(
          updater,
          this.moduleRef.get(updater.name, { strict: false }),
        );
      }
      this.logger.debug(
        `found updater for event ${event.constructor.name} - calling handle method`,
      );
      await this.instances.get(updater).handle(event);
    }
    return;
  }
}
