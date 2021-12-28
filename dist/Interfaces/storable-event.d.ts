import { IEvent } from '@nestjs/cqrs/dist/interfaces';
export interface IEventMeta {
    revision: number;
}
export declare abstract class StorableEvent implements IEvent {
    abstract id: string;
    abstract eventVersion: number;
    eventName: string;
    readonly meta: IEventMeta;
    constructor();
}
