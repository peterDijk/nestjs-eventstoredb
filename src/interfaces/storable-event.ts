import { IEvent } from '@nestjs/cqrs/dist/interfaces';

export interface IEventMeta {
  revision: number;
}

export abstract class StorableEvent implements IEvent {
  abstract id: string;
  abstract eventVersion: number;
  eventName: string;
  abstract aggregate: string;

  readonly meta: IEventMeta;

  constructor() {
    this.eventName = this.constructor.name;
  }
}
