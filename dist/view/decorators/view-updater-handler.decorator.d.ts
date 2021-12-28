import { IEvent } from '@nestjs/cqrs';
import { Type } from '@nestjs/common';
export declare function ViewUpdaterHandler(event: Type<IEvent>): (target: any) => void;
