import { IEvent } from '@nestjs/cqrs/dist/interfaces';

export interface IEventMeta {
  revision: number;
}

export abstract class StorableEvent implements IEvent {
  abstract id: string;
  abstract eventVersion: number;
  eventName: string;
  aggregate: string;

  readonly meta: IEventMeta;

  constructor(aggregate: string) {
    this.eventName = this.constructor.name;
    this.aggregate = aggregate;
  }
}
