import { DynamicModule } from '@nestjs/common';
import { EventSerializers, EventSourcingOptions } from './interfaces';
export declare class EventStoreModule {
    static forRoot(options: EventSourcingOptions): DynamicModule;
    static forFeature(options: {
        streamPrefix: string;
        eventSerializers: EventSerializers;
    }): Promise<DynamicModule>;
}
