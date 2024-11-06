import type { IWorld } from "./types.ts";
import type { IPlugin } from "../plugins.ts";
import type { IRenderer, IRenderNode, RenderInfo } from "../renderer.ts";
import type { IEventSystem } from "../event.ts";

/**
 * Parameters for creating a {@link World}.
 *
 * @template R Type of the renderer.
 * @template P Type of the plugin.
 * @template E Type of the event system.
 */
export interface IWorldParams<
  R extends IRenderer,
  P extends IPlugin,
  E extends IEventSystem,
> {
  /**
   * The renderer to be used.
   */
  renderer: R;
  /**
   * The plugins to be used.
   */
  plugins?: P[];
  /**
   * The event system to be used.
   */
  eventSystem: E;
}

/**
 * A basic `world` implementation.
 *
 * @template R Type of the renderer.
 * @template P Type of the plugin.
 * @template E Type of the event system.
 */
export class World<
  R extends IRenderer = IRenderer,
  P extends IPlugin = IPlugin,
  E extends IEventSystem = IEventSystem,
> implements IWorld<R, P, E> {
  /**
   * The plugins to be used.
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

  constructor(params: IWorldParams<R, P, E>) {
    this.plugins = params.plugins ?? [];
    this.renderer = params.renderer;
    this.eventSystem = params.eventSystem;
  }

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
  async start(): Promise<void> {
    await this.renderer.start();
    for (const plugin of this.plugins) {
      await plugin.start(this);
    }
    await this.eventSystem.start(this);
  }
  /**
   * Get the `IRenderNode` by its alias.
   */
  getRNode(alias: string): IRenderNode {
    return this.renderer.get(alias);
  }
  /**
   * Set the render info of an {@link IRenderNode}.
   *
   * @param alias The alias of the node.
   * @param renderInfo The render info to be set.
   * @param refresh Whether to refresh the renderer instantly after setting render info.
   * > This should be set to `true` for the 'last' render info setting in an update
   * > process, otherwise renderer will not be refreshed and changes cannot be seen.
   */
  setRenderInfo(alias: string, renderInfo: RenderInfo, refresh?: boolean): void {
    this.getRNode(alias).setRenderInfo(renderInfo);
    if (refresh) {
      this.renderer.refresh();
    }
  }
  /**
   * Get the plugin by its type.
   *
   * @param type The type of the plugin to get.
   * @returns The plugin instance if found, `null` otherwise.
   */
  getPlugin<T extends IPlugin>(type: new () => T): T | null {
    for (const plugin of this.plugins) {
      if (plugin instanceof type) {
        return plugin;
      }
    }
    return null;
  }
}
