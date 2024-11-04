import type { IWorld } from "./types.ts";
import type { IRenderer } from "../renderer.ts";
import type { IEventSystem } from "../event.ts";

/**
 * Parameters for creating an 'AutoRefreshWorld'.
 *
 * @template R Type of the renderer.
 * @template E Type of the event system.
 *
 * @param fps The refresh rate of the world. Default is 60.
 * @param renderer The renderer to be used, should be of type `R`.
 * @param eventSystem The event system to be used, should be of type `E`.
 */
export interface IAutoRefreshWorldParams<
  R extends IRenderer,
  E extends IEventSystem,
> {
  fps?: number;
  renderer: R;
  eventSystem: E;
}

/**
 * A 'world' that will refresh itself automatically.
 *
 * This 'world' will refresh the 'renderer' periodically, based on the given 'fps' value.
 */
export class AutoRefreshWorld<
  R extends IRenderer = IRenderer,
  E extends IEventSystem = IEventSystem,
> implements IWorld<R, E> {
  fps: number;
  renderer: R;
  eventSystem: E;

  constructor(params: IAutoRefreshWorldParams<R, E>) {
    this.fps = params.fps ?? 60;
    this.renderer = params.renderer;
    this.eventSystem = params.eventSystem;
  }

  start(): void {
    this._start().then(() => {
      setInterval(this._refresh.bind(this), 1000 / this.fps);
    });
  }
  setDirtyStatus(alias: string, dirtyStatus: DirtyStatus): void {
    this.renderer.board.get(alias).setDirtyStatus(dirtyStatus);
  }

  private async _start(): Promise<void> {
    await this.renderer.start();
    await this.eventSystem.start(this);
  }
  private _refresh(): void {
    this.renderer.refresh();
    this.eventSystem.refresh();
  }
}
