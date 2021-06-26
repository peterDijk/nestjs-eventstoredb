import { ViewUpdater } from './view';
import { ViewEventBus } from './view';
import { StoreEventBus } from './store-event-bus';
import { StoreEventPublisher } from './store-event-publisher';
import { AggregateRepository } from './aggregate-repository';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createEventSourcingProviders() {
  return [
    ViewUpdater,
    ViewEventBus,
    StoreEventBus,
    StoreEventPublisher,
    AggregateRepository,
  ];
}
