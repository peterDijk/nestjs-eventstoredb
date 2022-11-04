import { EventSerializers, EventStoreOptions } from './interfaces';
import {
  AppendExpectedRevision,
  END,
  EventStoreDBClient,
  FORWARDS,
  jsonEvent,
  NO_STREAM,
  Position,
  START,
  streamNameFilter,
} from '@eventstore/db-client';
import { IEvent } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { ViewEventBus } from './view';
import { Logger } from '@nestjs/common';

export class EventStore {
  private readonly eventstore: EventStoreDBClient;

  // TODO: make it a Set
  private aggregateEventSerializers: {
    [aggregate: string]: EventSerializers;
  } = {};
  private readonly config;
  private eventStoreLaunched = false;
  private logger = new Logger(EventStore.name);
  private lastPositionStorage?: {
    set: (stream: string, position: Object) => Promise<void>;
    get: (stream: string) => Promise<Object>;
  };

  constructor(options: EventStoreOptions) {
    try {
      this.eventstore = new EventStoreDBClient(
        {
          endpoint: { address: options.address, port: options.port },
        },
        { insecure: options.insecure },
      );
      if (this.eventstore) {
        this.logger.debug('EventStore connection successful');
      }
      this.eventStoreLaunched = true;
    } catch (err) {
      this.eventStoreLaunched = false;
    }

    if (options.lastPositionStorage) {
      this.lastPositionStorage = options.lastPositionStorage;
    }
  }

  public isInitiated(): boolean {
    return this.eventStoreLaunched;
  }

  public setSerializers(
    aggregate: string,
    eventSerializers: EventSerializers,
  ): void {
    this.logger.debug(`Setting serializers for ${aggregate}`);
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

      this.logger.debug(`going to appendToStream`);
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
      this.logger.debug(`done appendToStream`);
    });
  }

  toPosition(position: { commit: string; prepare: string }): Position | null {
    if (!position) return null;
    return {
      commit: BigInt(parseInt(position.commit)),
      prepare: BigInt(parseInt(position.prepare)),
    };
  }

  async getAll(
    viewEventsBus: ViewEventBus,
    streamPrefix: string,
  ): Promise<void> {
    this.logger.log('Replaying all events to build projection');
    const lastStoredPosition = await this.lastPositionStorage?.get(
      streamPrefix,
    );
    const lastStoredPositionBigInt = this.toPosition(lastStoredPosition as any);

    // read from above position
    // maybe not readAll
    const events = this.eventstore.readAll({
      direction: FORWARDS,
      fromPosition: lastStoredPositionBigInt ?? START,
    });

    let lastReadPosition: Position;

    for await (const { event } of events) {
      if (
        event.position.commit === lastStoredPositionBigInt.commit &&
        event.position.prepare === lastStoredPositionBigInt.prepare
      ) {
        this.logger.debug('Skip it, this was the last event I stored');
        continue;
      }

      const parsedEvent = this.aggregateEventSerializers[streamPrefix][
        event.type
      ]?.(event.data);

      if (parsedEvent) {
        try {
          await viewEventsBus.publish(parsedEvent);
          lastReadPosition = event.position;
        } catch (err) {
          this.logger.debug(err);
          throw Error('Error publishing on viewEventBus');
        }
      }
    }

    if (lastReadPosition) {
      await this.lastPositionStorage.set(streamPrefix, lastReadPosition);
      this.logger.debug(`Stored last read position: ${lastReadPosition}`);
    }

    this.logger.log(
      `Done parsing all past events to projection bus for '${streamPrefix}'`,
    );
  }

  subscribe(
    streamPrefix: string,
    bridge: Subject<any>,
    viewEventsBus: ViewEventBus,
  ): void {
    const filter = streamNameFilter({ prefixes: [streamPrefix] });
    const subscription = this.eventstore.subscribeToAll({
      filter,
      fromPosition: END,
    });
    subscription.on('data', data => {
      const parsedEvent = this.aggregateEventSerializers[streamPrefix][
        data.event.type
      ](data.event.data);

      const position = data.event.position;
      this.lastPositionStorage?.set(streamPrefix, position);

      // throw the parsed event on the main NestJS event bus (it will be picked up by handlers that are decorated by @EventsHandler)
      if (bridge) {
        bridge.next(parsedEvent);
      }

      // throw it onto our own ViewEventBus. Update handlers decorated with @ViewUpdaterHandler will be registered and called from the bus
      viewEventsBus.publish(parsedEvent);
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
