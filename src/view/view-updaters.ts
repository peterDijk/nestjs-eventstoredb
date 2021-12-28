import { IEvent } from '@nestjs/cqrs';
import { IViewUpdater } from './interfaces/view-updater';
import { Type } from '@nestjs/common';

export class ViewUpdaters {
  private static updaters = new Map<string, Type<IViewUpdater<IEvent>>>();

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static add(name: string, handler: Type<IViewUpdater<IEvent>>) {
    ViewUpdaters.updaters.set(name, handler);
  }

  static get(name: string): Type<IViewUpdater<IEvent>> {
    return ViewUpdaters.updaters.get(name);
  }
}
