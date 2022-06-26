import { Logger } from '@nestjs/common';
import { throws } from 'assert/strict';
import { EventSerializers } from './interfaces';

export class StoreEventMetadataStorage {
  private static readonly storage = new Map<string, EventSerializers>();

  static addSerializersByAggregateName(
    aggregate: string,
    serializers: EventSerializers,
  ): void {
    let collection = this.storage.get(aggregate);
    if (!collection) {
      collection = {} as unknown as EventSerializers;
      this.storage.set(aggregate, collection);
    }
    // TODO: validation exists
    Object.keys(serializers).forEach(element => {
      collection[element] = serializers[element];
    });

    Logger.debug(`storage: ${JSON.stringify(this.storage)}`);
  }
}
