export interface EventStoreOptions {
  address: string;
  port: number;
  insecure: boolean;
  lastPositionStorage?: {
    set: (stream: string, position: Object) => void;
    get: (stream: string) => Object;
  };
}
