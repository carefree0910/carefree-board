export * from "./pointer/base.ts";
export * from "./pointer/drag.ts";

import type { IEventHandler, IEventSystem } from "./types.ts";
import type { IWorld } from "../world.ts";

export class EventSystem implements IEventSystem {
  private handlers: IEventHandler[];

  constructor(handlers: IEventHandler[]) {
    this.handlers = handlers;
  }

  start(world: IWorld): Promise<void> {
    this.handlers.forEach((handler) => handler.bind(world));
    return Promise.resolve();
  }

  refresh(): void {
    this.handlers.forEach((handler) => handler.refresh());
  }
}
