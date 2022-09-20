# ✨ Event Sourcing for Nestjs using EventstoreDB

This package is a adaptation of `@berniemac`'s package: https://www.npmjs.com/package/@berniemac/event-sourcing-nestjs

[![](https://badgen.net/npm/v/@peterdijk/nestjs-eventstoredb)](https://www.npmjs.com/package/@peterdijk/nestjs-eventstoredb) ![](https://badgen.net/npm/dt/@peterdijk/nestjs-eventstoredb)

Library that implements event sourcing using NestJS and his CQRS library.

## ⭐️ Features

- **StoreEventBus**: A class that replaces Nest's EventBus to also persists events in EventStoreDB.
- **StoreEventPublisher**: A class that replaces Nest's EventPublisher.
- **ViewUpdaterHandler**: Use the ViewUpdater to handle the event in the EventHandler, so you can update your read database.
- **Replay**: You can re-run stored events. This will only trigger the view updater handlers to reconstruct your read db.
  Current version runs updaters on all events on app init. Improvement is planned.
- **EventStore**: Get history of events for an aggregate using `getEvents`.

## 📖 Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Importing](#importing)
  - [Events](#events)
  - [Event emitter](#event-emitter)
  - [Event Publisher](#event-publisher)
  - [Get event history](#get-event-history)
    - [Full example](#full-example)
  - [View updaters](#view-updaters)
    - [State of the art](#state-of-the-art)
- [Reconstructing the view db](#reconstructing-the-view-db)
- [Examples](#examples)

## 🛠 Installation

```bash
npm install @peterdijk/nestjs-eventstore @nestjs/cqrs --save
```

## Usage

### Importing

app.module.ts

```ts
import { Module } from '@nestjs/common';
import { EventStoreModule } from '@peterdijk/nestjs-eventstoredb';

@Module({
  imports: [
    EventStoreModule.forRoot({
      address: '0.0.0.0',
      port: 2113,
      insecure: true,
      lastPositionStorage: {
        set: (stream: string, position: Object) => {
          // TODO implement db connection
          console.log('setting last position', { stream, position });
        },
        get: (stream: string) => {
          // TODO implement db connection
          console.log('getting last position for: ', { stream });
          return {};
        },
      },
    }),
  ],
})
export class ApplicationModule {}
```

Importing it in your modules

```ts
import { Module } from '@nestjs/common';
import { EventStoreModule } from '@peterdijk/nestjs-eventstoredb';

@Module({
  imports: [
    EventStoreModule.forFeature({
      streamPrefix: 'game',
      eventSerializers: {
        NewGameStartedEvent: ({ id, wordToGuess, other_properties }) =>
          new NewGameStartedEvent(id, wordToGuess, other_properties),
      },
    }),
  ],
})
export class GamesModule {}
```

### Events

Your events must extend the abstract class StorableEvent.

```ts
export class NewGameStartedEvent extends StorableEvent {
  eventVersion = 1;
  id = '_id_';
}
```

### Event Publisher

Use **StoreEventPublisher** if you want to dispatch events from your AggregateRoot and store it before calling their handlers.

```ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../repository/game.repository';
import { StartNewGameCommand } from '../impl/StartNewGame.command';
import { StoreEventPublisher } from '@peterdijk/nestjs-eventstoredb';

@CommandHandler(StartNewGameCommand)
export class StartNewGameCommandHandler
  implements ICommandHandler<StartNewGameCommand>
{
  constructor(
    private readonly repository: GamesRepository,
    private readonly publisher: StoreEventPublisher,
  ) {}

  async execute({ data, uuid }: StartNewGameCommand) {
    const { playerId, wordToGuess, maxGuesses } = data;

    const game = this.publisher.mergeObjectContext(
      await this.repository.startNewGame(
        { playerId, wordToGuess, maxGuesses },
        uuid,
      ),
    );

    game.commit();
  }
}
```

### Get event history

Reconstruct an aggregate getting it's event history when your event performs an action on a previously created aggregate (in this example, guessing a letter on a previously created hangman game)

```ts
@Injectable()
export class GamesRepository {
  constructor(
    private readonly eventStore: EventStore,
    private readonly eventBus: StoreEventBus,
  ) {}

  async findOneById(aggregateId: string): Promise<Game> {
    const game = new Game(aggregateId);
    const { events } = await this.eventStore.getEvents(
      this.eventBus.streamPrefix,
      aggregateId,
    );
    game.loadFromHistory(events);
    return game;
  }

  ...

  async guessLetter(gameId: string, letter: string) {
    const game = await this.findOneById(gameId);
    await game.guessLetter(letter);

    return game;
  }
```

#### Note about loadfromHistory

NestJS's AggregateRoot's method `loadFromHistory` looks for methods on the aggregate of which the name starts with `on` and then the name of the event: `onNewGameStartedEvent`.
In this method set the state of the aggregate using the event's properties.

#### Full example

hero-killed-dragon.event.ts

```ts
import { StorableEvent } from '@peterdijk/nestjs-eventstoredb';

export class HeroKilledDragonEvent extends StorableEvent {
  eventVersion = 1;

  constructor(public readonly id: string, public readonly dragonId: string) {
    super();
  }
}
```

hero.model.ts

```ts
import { AggregateRoot } from '@nestjs/cqrs';

export class Hero extends AggregateRoot {
  public readonly id: string;

  public dragonsKilled: string[] = [];

  public state: any;

  constructor(id: string, version?: number, state?: any) {
    super();
    this.id = id;
    this.version = version;
    this._state = state || {}; // alternatively merge state with this
  }

  killEnemy(enemyId: string) {
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }

  onHeroKilledDragonEvent(event: HeroKilledDragonEvent) {
    this.dragonsKilled.push(event.dragonId);
  }
}
```

hero.repository.ts

```ts
import { Injectable } from '@nestjs/common';
import { Hero } from '../models/hero.model';
import { EventStore, StoreEventBus } from '@peterdijk/nestjs-eventstoredb';

@Injectable()
export class HeroRepository {
  constructor(
    private readonly eventStore: EventStore,
    private readonly eventBus: StoreEventBus,
  ) {}

  async findOneById(id: string): Promise<Hero> {
    const hero = new Hero(id);
    const { events } = await this.eventStore.getEvents(
      this.eventBus.streamPrefix,
      id,
    );
    hero.loadFromHistory(events);
    return hero;
  }
}
```

### View updaters

#### State of the art

![State of the art](https://raw.githubusercontent.com/ArkerLabs/event-sourcing-nestjs/master/docs/state.jpg)

After emitting an event, use a view updater to update the read database state.
This view updaters will be used to recontruct the db if needed.

Read more info about the Materialized View pattern [here](https://docs.microsoft.com/en-gb/azure/architecture/patterns/materialized-view)

```ts
import {
  IViewUpdater,
  ViewUpdaterHandler,
} from '@peterdijk/nestjs-eventstoredb';

@ViewUpdaterHandler(UserCreatedEvent)
export class UserCreatedUpdater implements IViewUpdater<UserCreatedEvent> {
  async handle(event: UserCreatedEvent) {
    // Save user into our view db
  }
}
```

## Reconstructing the view db

(w.i.p. to implement this in this version)

```ts
await ReconstructViewDb.run(await NestFactory.create(AppModule.forRoot()));
```

## Examples

You can find a working example using the Materialized View pattern [here](https://github.com/ArkerLabs/event-sourcing-nestjs-example).

Also a working example with Nest aggregates working [here](https://github.com/Nytyr/nest-cqrs-eventsourcing-example).

## 📝 Stay in touch

- Author - [Nytyr](https://keybase.io/nytyr)
- Website - [https://arkerlabs.com/](https://arkerlabs.com/)
