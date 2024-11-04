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
  /**
   * Refresh the event system, this can be called frequently (e.g., every frame).
   *
   * > Not all event systems need to implement this method. For example, in a web `world`,
   * > event loop is managed by the browser, so all we need to do is to set up the bindings.
   */
  refresh(): void;
}

/**
 * Event handler's abstract interface.
 *
 * It's pretty simple to think of an event handler: bind itself to the world at
 * {@link IEventSystem.start}, then refresh itself at {@link IEventSystem.refresh}.
 */
export interface IEventHandler {
  /**
   * Bind the handler to the world.
   *
   * @param world - The `world` to bind the handler to.
   */
  bind(world: IWorld): void;
  /**
   * Refresh the handler, this can be called frequently (e.g., every frame).
   *
   * > Not all event handlers need to implement this method, as mentioned in {@link IEventSystem.refresh}.
   */
  refresh(): void;
}
