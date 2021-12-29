import { StorableEvent } from '.';

export interface EventSerializers {
  [EventName: string]: (options: unknown) => StorableEvent;
}
