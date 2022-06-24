import { ViewUpdaters } from '../view-updaters';
import { IEvent } from '@nestjs/cqrs';
import { Type, Logger } from '@nestjs/common';
import { IViewUpdater } from '../interfaces';

export function ViewUpdaterHandler(
  event: Type<IEvent>,
): (target: Type<IViewUpdater<IEvent>>) => void {
  const logger = new Logger(ViewUpdaterHandler.name);
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  return (target: Type<IViewUpdater<IEvent>>) => {
    ViewUpdaters.add(event.name, target);
    logger.debug(`registered updater event ${event.name}`);
    logger.debug(
      `current registered updater handlers: ${ViewUpdaters.getAll()}`,
    );
  };
}
