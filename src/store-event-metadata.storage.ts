import { Logger } from '@nestjs/common';
import { throws } from 'assert/strict';
import { EventStoreModule } from './eventstore.module';
import { EventSerializers } from './interfaces';

export class StoreEventMetadataStorage {
  private static readonly storage = new Map<string, EventSerializers>();
  private static aggregates: string[] = [];
  private static serializers: {
    [aggregate: string]: EventSerializers;
  } = {};

  static addSerializersByAggregateName(
    aggregate: string,
    serializers: EventSerializers,
  ): void {
    Logger.debug(`aggregate: ${aggregate}`);
    let collection = this.storage.get(aggregate);
    if (!collection) {
      collection = {} as unknown as EventSerializers;
      this.storage.set(aggregate, collection);
      Logger.debug(`done setting storage`);
    }
    // TODO: validation exists
    Object.keys(serializers).forEach(element => {
      collection[element] = serializers[element];
    });

    Logger.debug(`storage: ${JSON.stringify(this.storage.entries())}`);
  }

  static addAggregate(aggregate: string): void {
    this.aggregates.push(aggregate);
  }

  static addAggregateAndSerializers(
    aggregate: string,
    serializers: EventSerializers,
  ): void {
    console.log({ aggregate, serializers });
    this.aggregates.push(aggregate);
    this.serializers[aggregate] = serializers;
  }

  static getSerializers(): {
    [aggregate: string]: EventSerializers;
  } {
    return this.serializers;
  }

  static getAggregates(): string[] {
    return this.aggregates;
  }
}
