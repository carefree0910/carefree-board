import type { DirtyStatus, IBoardNode } from "../board.ts";
import type { IPlugin } from "../plugins.ts";
import type { IRenderer } from "../renderer.ts";
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
  start(): void;
  /**
   * Get the `IBoardNode` by its alias.
   */
  getBNode(alias: string): IBoardNode;
  /**
   * Set the dirty status of an {@link IBoardNode}.
   *
   * @param alias The alias of the node.
   * @param dirtyStatus The dirty status to be set.
   */
  setDirtyStatus(alias: string, dirtyStatus: DirtyStatus): void;
}
