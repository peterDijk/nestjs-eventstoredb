import { IEvent } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
export declare class ViewUpdater {
    private moduleRef;
    private instances;
    constructor(moduleRef: ModuleRef);
    run<T extends IEvent>(event: T): Promise<void>;
}
