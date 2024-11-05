import type { IWorld } from "./types.ts";
import type { DirtyStatus, IBoardNode } from "../board.ts";
import type { IPlugin } from "../plugins.ts";
import type { IRenderer } from "../renderer.ts";
import type { IEventSystem } from "../event.ts";

/**
 * Parameters for creating an {@link AutoRefreshWorld}.
 *
 * @template R Type of the renderer.
 * @template P Type of the plugin.
 * @template E Type of the event system.
 */
export interface IAutoRefreshWorldParams<
  R extends IRenderer,
  P extends IPlugin,
  E extends IEventSystem,
> {
  /**
   * The refresh rate of the world. Default is 60.
   */
  fps?: number;
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
 * A `world` that will refresh itself automatically.
 *
 * This `world` will refresh the `renderer` periodically, based on the given `fps` value.
 *
 * @template R Type of the renderer.
 * @template P Type of the plugin.
 * @template E Type of the event system.
 */
export class AutoRefreshWorld<
  R extends IRenderer = IRenderer,
  P extends IPlugin = IPlugin,
  E extends IEventSystem = IEventSystem,
> implements IWorld<R, P, E> {
  /**
   * The refresh rate of the world. Default is 60.
   */
  fps: number;
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

  constructor(params: IAutoRefreshWorldParams<R, P, E>) {
    this.fps = params.fps ?? 60;
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
  start(): void {
    this._start().then(() => {
      setInterval(this._refresh.bind(this), 1000 / this.fps);
    });
  }
  /**
   * Get the `IBoardNode` by its alias.
   */
  getBNode(alias: string): IBoardNode {
    return this.renderer.board.get(alias);
  }
  /**
   * Set the dirty status of an {@link IBoardNode}.
   *
   * @param alias The alias of the node.
   * @param dirtyStatus The dirty status to be set.
   */
  setDirtyStatus(alias: string, dirtyStatus: DirtyStatus): void {
    this.getBNode(alias).setDirtyStatus(dirtyStatus);
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

  private async _start(): Promise<void> {
    await this.renderer.start();
    for (const plugin of this.plugins) {
      await plugin.start(this);
    }
    await this.eventSystem.start(this);
  }
  private _refresh(): void {
    this.renderer.refresh();
    for (const plugin of this.plugins) {
      plugin.refresh();
    }
    this.eventSystem.refresh();
  }
}
