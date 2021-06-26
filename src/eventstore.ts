import { StorableEvent } from './interfaces/storable-event';
import { EventSourcingOptions } from './interfaces';
import * as eventstore from 'eventstore';
import * as url from 'url';

export class EventStore {
  private readonly eventstore;
  private readonly config;
  private eventStoreLaunched = false;

  constructor(options: EventSourcingOptions) {
    let ssl = false;

    this.config = options.aggregateSnapshot || {};

    const parsed = url.parse(options.mongoURL, true);

    if (
      parsed.query &&
      parsed.query.ssl !== undefined &&
      parsed.query.ssl === 'true'
    ) {
      ssl = true;
    }

    this.eventstore = eventstore({
      type: 'mongodb',
      url: options.mongoURL,
      maxSnapshotsCount: options.maxSnapshots,
      options: {
        ssl: ssl,
      },
    });

    this.eventstore.init(err => {
      if (err) {
        throw err;
      }
      this.eventStoreLaunched = true;
    });
  }

  public isInitiated(): boolean {
    return this.eventStoreLaunched;
  }

  public getSnapshotInterval(aggregate: string): number | null {
    return this.config ? this.config[aggregate] : null;
  }

  public async createSnapshot(
    aggregate: string,
    id: string,
    revision: number,
    state: string,
  ): Promise<any> {
    return new Promise<any>(resolve => {
      this.eventstore.createSnapshot(
        {
          streamId: this.getAggregateId(aggregate, id),
          data: state,
          revision: revision,
        },
        function (err) {
          // snapshot saved
        },
      );
    });
  }

  public async getEventsFromSnapshot(
    aggregate: string,
    id: string,
  ): Promise<{ events: StorableEvent[]; snapshot: any; lastRevision: number }> {
    return new Promise<{
      events: StorableEvent[];
      snapshot: any;
      lastRevision: number;
    }>(resolve => {
      this.eventstore.getFromSnapshot(
        this.getAggregateId(aggregate, id),
        (err, snapshot, stream) => {
          const events = stream.events.map(event => {
            return this.getStorableEventFromPayload(event.payload);
          });

          resolve({
            events: events,
            snapshot: snapshot?.data,
            lastRevision: stream.lastRevision,
          });
        },
      );
    });
  }

  public async getEvent(index: number): Promise<StorableEvent> {
    return new Promise<StorableEvent>((resolve, reject) => {
      this.eventstore.getEvents(index, 1, (err, events) => {
        if (events.length > 0) {
          resolve(this.getStorableEventFromPayload(events[0].payload));
        } else {
          resolve(null);
        }
      });
    });
  }

  public async storeEvent<T extends StorableEvent>(event: T): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.eventStoreLaunched) {
        reject('Event Store not launched!');
        return;
      }
      this.eventstore.getEventStream(
        {
          aggregateId: this.getAggregateId(event.eventAggregate, event.id),
          aggregate: event.eventAggregate,
        },
        (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          stream.addEvent(event);
          stream.commit(commitErr => {
            if (commitErr) {
              reject(commitErr);
            }
            resolve();
          });
        },
      );
    });
  }

  // Monkey patch to obtain event 'instances' from db
  private getStorableEventFromPayload(payload: any): StorableEvent {
    const eventPlain = payload;
    eventPlain.constructor = {
      name: eventPlain.eventName,
    };

    return Object.assign(Object.create(eventPlain), eventPlain);
  }

  private getAggregateId(aggregate: string, id: string): string {
    return aggregate + '-' + id;
  }
}
