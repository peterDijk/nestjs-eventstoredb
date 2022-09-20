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

  constructor(private moduleRef: ModuleRef) {
    this.logger.debug(moduleRef);
  }

  async run<T extends IEvent>(event: T): Promise<void> {
    this.logger.debug(`running ViewUpdater for ${event.constructor.name}`);
    const updater = ViewUpdaters.get(event.constructor.name);
    this.logger.debug(`updater: ${updater}`);
    if (updater) {
      if (!this.instances.has(updater)) {
        try {
          this.logger.debug(`not in private instances yet`);
          this.logger.debug(
            `moduleRef: ${this.moduleRef}; updater.name: ${updater.name}`,
          );

          const moduleUpdater = await this.moduleRef.get(updater.name, {
            strict: false,
          });
          this.logger.debug(moduleUpdater);
          this.instances.set(updater, moduleUpdater);
        } catch (err) {
          this.logger.debug(err);
        }
      }
      this.logger.debug(
        `found updater for event ${event.constructor.name} - calling handle method`,
      );
      await this.instances.get(updater).handle(event);
    }
    return;
  }
}
