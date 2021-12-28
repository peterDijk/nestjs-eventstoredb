import { IEvent } from '@nestjs/cqrs';
import { IViewUpdater } from './Interfaces/View-Updater';
import { Type } from '@nestjs/common';
export declare class ViewUpdaters {
    private static updaters;
    static add(name: string, handler: Type<IViewUpdater<IEvent>>): void;
    static get(name: string): Type<IViewUpdater<IEvent>>;
}
