import { EventSerializers } from './interfaces';

export class StoreEventMetadataStorage {
  private static readonly storage = new Map<string, EventSerializers>();
  private static aggregates: string[] = [];
  private static serializers: {
    [aggregate: string]: EventSerializers;
  } = {};

  static addAggregateAndSerializers(
    aggregate: string,
    serializers: EventSerializers,
  ): void {
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
