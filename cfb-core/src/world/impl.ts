import type { IWorld } from "./types.ts";
import type { IRenderer } from "../renderer.ts";
import type { IEventSystem } from "../event.ts";

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
> implements IWorld {
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

  private async _start(): Promise<void> {
    await this.renderer.start();
    await this.eventSystem.start(this);
  }
  private _refresh(): void {
    this.renderer.refresh();
    this.eventSystem.refresh();
  }
}
