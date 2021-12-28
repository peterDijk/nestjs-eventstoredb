import { IEvent } from '@nestjs/cqrs/dist/interfaces';

export interface EventSourcingOptions {
  eventStoreUrl: string;
}
