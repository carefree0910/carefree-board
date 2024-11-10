import type { IRenderer } from "../renderer.ts";
import type { IWorld } from "../world.ts";

/**
 * Interface for plugins.
 *
 * > There is an implicit constraint that plugins should not have arguments in their
 * > constructor. This is to ensure that the `world` instance can retrieve the plugin
 * > instance by its type.
 *
 * @template R Type of the renderer.
 */
export interface IPlugin<R extends IRenderer = IRenderer> {
  /**
   * Start the plugin, bindings should be set up here.
   *
   * @param world The `world` instance.
   */
  start(world: IWorld<R>): Promise<void>;
}
