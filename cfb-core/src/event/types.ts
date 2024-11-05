import type { IWorld } from "../world.ts";

/**
 * Event system's abstract interface.
 *
 * An event system is responsible for managing user interactions (e.g., mouse clicks,
 * keyboard presses, etc.). Different `world` may have different event handling
 * mechanisms, so this interface is kept abstract.
 */
export interface IEventSystem {
  /**
   * Start the event system, bindings should be set up here.
   *
   * @param world - The `world` to bind the event system to.
   */
  start(world: IWorld): Promise<void>;
}

/**
 * Event handler's abstract interface.
 *
 * We hardly make any assumptions about the event handler: just bind it to the world.
 */
export interface IEventHandler {
  /**
   * Bind the handler to the world.
   *
   * @param world - The `world` to bind the handler to.
   */
  bind(world: IWorld): void;
}
