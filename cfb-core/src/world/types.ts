import type { IPlugin } from "../plugins.ts";
import type { IRenderer, IRenderNode, RenderInfo } from "../renderer.ts";
import type { IEventSystem } from "../event.ts";

/**
 * World interface.
 *
 * A `world` is the highest level of abstraction in the whole system. It should be
 * responsible to handle other layers (e.g., renderer, events, plugins, ...) and
 * combine them together.
 *
 * In most cases, it is a thin wrapper around the layers, and serves as the 'middleman'
 * for layers to communicate with each other.
 *
 * Downstream 'concrete' applications should also only interact with the `world`.
 *
 * @template R Type of the renderer layer.
 * @template P Type of the plugin.
 * @template E Type of the event system layer.
 */
export interface IWorld<
  R extends IRenderer = IRenderer,
  P extends IPlugin = IPlugin,
  E extends IEventSystem = IEventSystem,
> {
  /**
   * The event system to be used.
   */
  plugins: P[];
  /**
   * The renderer to be used.
   */
  renderer: R;
  /**
   * The event system to be used.
   */
  eventSystem: E;

  /**
   * Start the `world`. This method should activate all binding layers.
   * > We found that in practice, the activation order of layers is important, and is
   * > suggested to keep consistent. Here's a common order:
   * >
   * > 1. Renderer.
   * > 2. Plugins.
   * > 3. Event system.
   * >
   * > This list can be extended in the future, and concrete implementations should be
   * > updated accordingly.
   */
  start(): Promise<void>;
  /**
   * Get the `IRenderNode` by its alias.
   */
  getRNode(alias: string): IRenderNode;
  /**
   * Set the render info of an {@link IRenderNode}.
   *
   * @param alias The alias of the node.
   * @param renderInfo The render info to be set.
   * @param refresh Whether to refresh the renderer instantly after setting render info.
   * > This should be set to `true` for the 'last' render info setting in an update
   * > process, otherwise renderer will not be refreshed and changes cannot be seen.
   */
  setRenderInfo(alias: string, renderInfo: RenderInfo, refresh?: boolean): void;
  /**
   * Get the plugin by its type.
   *
   * @param type The type of the plugin to get.
   * @returns The plugin instance if found, `null` otherwise.
   */
  getPlugin<T extends IPlugin>(type: new () => T): T | null;
}
