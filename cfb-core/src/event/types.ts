import type { IWorld } from "../world.ts";

/**
 * Event system's abstract interface.
 *
 * An event system is responsible for managing user interactions (e.g., mouse clicks,
 * keyboard presses). Different 'world' may have different event handling mechanisms,
 * so the interface is kept abstract.
 *
 * @method start - Start the event system, bindings should be set up here.
 * @method refresh - Refresh the event system, this can be called frequently (e.g., every frame).
 * > Not all event systems need to implement this method. For example, in a web 'world',
 * > event loop is managed by the browser, so all we need to do is to set up the bindings.
 */
export interface IEventSystem {
  start(world: IWorld): Promise<void>;
  refresh(): void;
}

/**
 * Event handler's abstract interface.
 *
 * It's pretty simple to think of an event handler: bind itself to the world at `IEventSystem.start`,
 * then refresh itself at `IEventSystem.refresh`.
 *
 * @method bind - Bind the handler to the world.
 * @method refresh - Refresh the handler, this can be called frequently (e.g., every frame).
 * > Not all event handlers need to implement this method, as mentioned in `IEventSystem.refresh`.
 */
export interface IEventHandler {
  bind(world: IWorld): void;
  refresh(): void;
}
