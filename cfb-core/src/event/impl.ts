export * from "./pointer/base.ts";
export * from "./pointer/drag.ts";

import type { IEventHandler, IEventSystem } from "./types.ts";
import type { IWorld } from "../world.ts";

/**
 * A simple event system that dispatches events to handlers.
 *
 * > All logics are defined in the {@link IEventHandler} interface.
 */
export class EventSystem implements IEventSystem {
  private handlers: IEventHandler[];

  constructor(handlers: IEventHandler[]) {
    this.handlers = handlers;
  }

  /**
   * Bind the `world` to the handlers.
   *
   * @param world The `world` to be bound.
   */
  start(world: IWorld): Promise<void> {
    this.handlers.forEach((handler) => handler.bind(world));
    return Promise.resolve();
  }

  /**
   * Refresh the handlers.
   */
  refresh(): void {
    this.handlers.forEach((handler) => handler.refresh());
  }
}
