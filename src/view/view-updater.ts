import { Injectable, Type, Logger } from '@nestjs/common';
import { IViewUpdater } from './interfaces/view-updater';
import { IEvent } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { ViewUpdaters } from './view-updaters';

@Injectable()
export class ViewUpdater {
  private instances = new Map<
    Type<IViewUpdater<IEvent>>,
    IViewUpdater<IEvent>[]
  >();
  private logger = new Logger(ViewUpdater.name);

  constructor(private moduleRef: ModuleRef) {}

  async run<T extends IEvent>(event: T): Promise<void> {
    this.logger.debug(`running ViewUpdater for ${event.constructor.name}`);
    const updaters = ViewUpdaters.get(event.constructor.name);
    if (updaters) {
      this.logger.debug(
        `amount updaters found for event ${event.constructor.name}: ${updaters.length}`,
      );
      updaters.forEach(async updater => {
        if (!this.instances.has(updater)) {
          try {
            const moduleUpdater = this.moduleRef.get(updater, {
              strict: false,
            });
            this.instances.set(updater, [moduleUpdater]);
          } catch (err) {
            this.logger.debug(err);
          }
        }

        this.logger.debug(
          `found updater for event ${event.constructor.name} - calling handle method`,
        );

        this.instances
          .get(updater)
          .forEach(async instance => await instance.handle(event));
      });
    }
    return;
  }
}
