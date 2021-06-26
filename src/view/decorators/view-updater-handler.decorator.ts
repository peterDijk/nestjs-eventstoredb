import { ViewUpdaters } from '../view-updaters';
import { IEvent } from '@nestjs/cqrs';
import { Type } from '@nestjs/common';

export function ViewUpdaterHandler(event: Type<IEvent>) {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  return (target: any) => {
    ViewUpdaters.add(event.name, target);
  };
}
