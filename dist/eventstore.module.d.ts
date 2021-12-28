import { DynamicModule } from '@nestjs/common';
import { EventSerializers, EventStoreOptions } from './interfaces';
export declare class EventStoreModule {
    static forRoot(options: EventStoreOptions): DynamicModule;
    static forFeature(options: {
        streamPrefix: string;
        eventSerializers: EventSerializers;
    }): Promise<DynamicModule>;
}
