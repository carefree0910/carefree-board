import type { IEventSystem } from "../event.ts";
import type { IRenderer } from "../renderer.ts";
import type { IWorld } from "../world.ts";

/**
 * Interface for plugins.
 *
 * @template R Type of the renderer.
 * @template E Type of the event system.
 */
export interface IPlugin<
  R extends IRenderer = IRenderer,
  E extends IEventSystem = IEventSystem,
> {
  /**
   * Start the plugin, bindings should be set up here.
   *
   * @param world The `world` instance.
   */
  start(world: IWorld<R, E>): Promise<void>;
  /**
   * Refresh the plugin, this can be called frequently (e.g., every frame).
   * > Not all plugins need to implement this method - it's up to the plugin's behavior.
   */
  refresh(): void;
}
