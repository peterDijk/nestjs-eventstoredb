export interface EventSourcingOptions {
  mongoURL: string;
  maxSnapshots: number;
  aggregateSnapshot: { [key: string]: number };
}
