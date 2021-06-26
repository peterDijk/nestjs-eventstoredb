import { Injectable } from '@nestjs/common';
import { Type } from './metadata';
import { EventStore } from './eventstore';
import { IAggregateRoot } from './interfaces';
import { AggregateRoot } from '@nestjs/cqrs';

@Injectable()
export class AggregateRepository {
  constructor(
    private readonly eventStore: EventStore, // private readonly options?: any,
  ) {}

  async getById<T extends AggregateRoot & IAggregateRoot>(
    type: Type<T>,
    aggregateName: string,
    aggregateId: string,
  ): Promise<T | null> {
    const { events, snapshot, lastRevision } =
      await this.eventStore.getEventsFromSnapshot(aggregateName, aggregateId);

    if (!events || events.length === 0) {
      return null;
    }

    const aggregate = new type(aggregateId, lastRevision, snapshot);
    aggregate.loadFromHistory(events);

    const performSnapshotAt =
      this.eventStore.getSnapshotInterval(aggregateName);

    if (performSnapshotAt && events.length > performSnapshotAt) {
      this.eventStore.createSnapshot(
        aggregateName,
        aggregateId,
        lastRevision,
        aggregate.state,
      );
    }

    return aggregate;
  }
}
