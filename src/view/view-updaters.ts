import { IEvent } from '@nestjs/cqrs';
import { IViewUpdater } from './interfaces/view-updater';
import { Type, Logger } from '@nestjs/common';

export class ViewUpdaters {
  private static updaters = new Map<string, Type<IViewUpdater<IEvent>>[]>();
  private static logger = new Logger(ViewUpdaters.name);

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static add(name: string, handler: Type<IViewUpdater<IEvent>>) {
    const existingUpdater = ViewUpdaters.updaters.get(name);
    ViewUpdaters.updaters.set(name, [...existingUpdater, handler]);
  }

  static get(name: string): Type<IViewUpdater<IEvent>>[] {
    return ViewUpdaters.updaters.get(name);
  }
}
