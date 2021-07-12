import { Injectable } from '@nestjs/common';
import { Type } from './metadata';
import { EventStore } from './eventstore';
import { AggregateRoot } from '@nestjs/cqrs';

@Injectable()
export class AggregateRepository {
  constructor(
    private readonly eventStore: EventStore, // private readonly options?: any,
  ) {}

  async getById<T extends AggregateRoot>(
    type: Type<T>,
    aggregateName: string,
    aggregateId: string,
  ): Promise<T | null> {
    const { events, snapshot, lastRevision } = await this.eventStore.getEvents(
      aggregateName,
      aggregateId,
    );

    if (!events || events.length === 0) {
      return null;
    }

    const aggregate = new type(aggregateId, lastRevision, snapshot);
    aggregate.loadFromHistory(events);

    const performSnapshotAt =
      this.eventStore.getSnapshotInterval(aggregateName);

    if (performSnapshotAt && events.length > performSnapshotAt) {
      const state = (aggregate as any).state;

      if (state) {
        this.eventStore.createSnapshot(
          aggregateName,
          aggregateId,
          lastRevision,
          state,
        );
      }
    }

    return aggregate;
  }
}
