import { Position } from '@eventstore/db-client';

export interface EventStoreOptions {
  address: string;
  port: number;
  insecure: boolean;
  lastPositionStorage?: {
    set: (stream: string, position: Object) => Promise<void>;
    get: (stream: string) => Promise<Object>;
  };
  lastPositionStorageFactory?: () => Promise<{
    set: (stream: string, position: Object) => Promise<void>;
    get: (stream: string) => Promise<Object>;
  }>;
}
