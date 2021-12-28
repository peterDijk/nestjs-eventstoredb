import { EventSerializers, EventSourcingOptions } from './interfaces';
import {
  AppendExpectedRevision,
  END,
  EventStoreDBClient,
  FORWARDS,
  jsonEvent,
  NO_STREAM,
  START,
  streamNameFilter,
} from '@eventstore/db-client';
import { IEvent } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { ViewEventBus } from './view';
import { Logger } from '@nestjs/common';

export class EventStore {
  private readonly eventstore: EventStoreDBClient;
  private aggregateEventSerializers: {
    [aggregate: string]: EventSerializers;
  } = {};
  private readonly config;
  public eventStoreLaunched = false;

  private logger = new Logger(EventStore.name);

  constructor(options: EventSourcingOptions) {
    try {
      this.eventstore = EventStoreDBClient.connectionString(
        options.eventStoreUrl,
      );
      this.eventStoreLaunched = true;
    } catch (err) {
      this.eventStoreLaunched = false;
    }
  }

  public isInitiated(): boolean {
    return this.eventStoreLaunched;
  }

  public setSerializers(aggregate: string, eventSerializers: EventSerializers) {
    this.aggregateEventSerializers[aggregate] = eventSerializers;
  }

  // public getSnapshotInterval(aggregate: string): number | null {
  //   return this.config ? this.config[aggregate] : null;
  // }

  public async getEvents(
    aggregate: string,
    id: string,
  ): Promise<{
    events: IEvent[];
    snapshot?: any;
    lastRevision: AppendExpectedRevision;
  }> {
    return new Promise<{
      events: IEvent[];
      snapshot?: any;
      lastRevision: AppendExpectedRevision;
    }>(async resolve => {
      const events = [];
      let revision: AppendExpectedRevision = NO_STREAM;

      const eventStream = await this.eventstore.readStream(
        this.getAggregateId(aggregate, id),
      );

      for await (const resolvedEvent of eventStream) {
        revision = resolvedEvent.event?.revision ?? revision;
        const parsedEvent = this.aggregateEventSerializers[aggregate][
          resolvedEvent.event.type
        ](resolvedEvent.event.data);
        events.push(parsedEvent);
      }
      resolve({ events, lastRevision: revision });
    });
  }

  // public async getEvent(index: number): Promise<IEvent> {
  //   return new Promise<IEvent>((resolve, reject) => {
  //     this.getEvents(index, 1, (err, events) => {});
  //   });
  // }

  public async storeEvent<T extends IEvent>(
    event: T,
    streamPrefix: string,
  ): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!this.eventStoreLaunched) {
        reject('Event Store not launched!');
        return;
      }
      const eventSerialized = JSON.stringify(event);
      const eventDeserialized = JSON.parse(eventSerialized);

      let revision: AppendExpectedRevision = NO_STREAM;

      try {
        const events = this.eventstore.readStream(
          this.getAggregateId(streamPrefix, eventDeserialized.id),
          {
            fromRevision: START,
            direction: FORWARDS,
          },
        );

        for await (const { event } of events) {
          revision = event?.revision ?? revision;
        }
      } catch (err) {}

      await this.eventstore.appendToStream(
        this.getAggregateId(streamPrefix, eventDeserialized.id),
        jsonEvent({
          id: eventDeserialized.id,
          type: eventDeserialized.eventName,
          data: {
            ...JSON.parse(eventSerialized),
          },
        }),
        { expectedRevision: revision },
      );
    });
  }

  async getAll(
    viewEventsBus: ViewEventBus,
    streamPrefix: string,
  ): Promise<void> {
    this.logger.log('Replaying all events to build projection');
    // maybe not readAll
    const events = this.eventstore.readAll();

    for await (const { event } of events) {
      const parsedEvent = this.aggregateEventSerializers[streamPrefix][
        event.type
      ]?.(event.data);

      if (parsedEvent) {
        try {
          await viewEventsBus.publish(parsedEvent);
        } catch (err) {
          throw Error('Error updating projection');
        }
      }
    }
    this.logger.log('Done parsing all past events to projection');
  }

  subscribe(streamPrefix: string, bridge: Subject<any>) {
    const filter = streamNameFilter({ prefixes: [streamPrefix] });
    const subscription = this.eventstore.subscribeToAll({
      filter,
      fromPosition: END,
    });
    subscription.on('data', data => {
      const parsedEvent = this.aggregateEventSerializers[streamPrefix][
        data.event.type
      ](data.event.data);
      if (bridge) {
        bridge.next(parsedEvent);
      }
    });
    this.logger.log(`Subscribed to all streams with prefix '${streamPrefix}-'`);
  }

  // Monkey patch to obtain event 'instances' from db
  // private getStorableEventFromPayload(event: any): StorableEvent {
  //   const { payload } = event;
  //   const eventPlain = payload;
  //   eventPlain.constructor = {
  //     name: eventPlain.eventName,
  //   };

  //   const transformedEvent = Object.assign(
  //     Object.create(eventPlain),
  //     eventPlain,
  //   );
  //   transformedEvent.meta = {
  //     revision: event.streamRevision,
  //   };
  //   return transformedEvent;
  // }

  private getAggregateId(aggregate: string, id: string): string {
    return aggregate + '-' + id;
  }
}
