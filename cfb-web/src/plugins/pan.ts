import type {
  IKeyboardEmitEvent,
  IPointerData,
  IWheelData,
  IWorld,
  StopPropagate,
} from "@carefree0910/cfb-core";
import type { WebRenderer } from "../renderer.ts";
import type { WebWorld } from "../world.ts";

import {
  keyboardEvent,
  Point,
  PointerHandlerBase,
  wheelEvent,
} from "@carefree0910/cfb-core";
import { WebKeyboardPlugin } from "./keyboard.ts";
import { getNormalizedWheelDelta } from "./utils.ts";

export class PanHandler extends PointerHandlerBase<WebWorld> {
  private _world?: WebWorld;
  private _renderer?: WebRenderer;
  private pointer?: Point;
  private inPanReady: boolean = false;
  private inPan: boolean = false;

  get world(): WebWorld {
    if (!this._world) {
      throw new Error("`world` is not bound to the handler");
    }
    return this._world;
  }
  get renderer(): WebRenderer {
    if (!this._renderer) {
      throw new Error("`renderer` is not bound to the handler");
    }
    return this._renderer;
  }

  bind(world: WebWorld): void {
    this._world = world;
    this._renderer = world.renderer;
    wheelEvent.on(this.onWheelEvent.bind(this));
    keyboardEvent.on(this.onKeyboardEvent.bind(this));
  }

  exec(data: IPointerData<IWorld>): Promise<StopPropagate> {
    if (this.inPanReady) {
      switch (data.e.type) {
        case "onPointerDown":
          this.inPan = true;
          this.pointer = this.getRawPointer(data.e);
          this.renderer.container.style.cursor = "grabbing";
          break;
        case "onPointerMove":
          if (this.inPan && this.pointer) {
            const current = this.getRawPointer(data.e);
            const delta = current.subtract(this.pointer);
            data.world.renderer.globalMove(delta);
            this.pointer = current;
          }
          break;
        case "onPointerUp":
          this.inPan = false;
          if (this.inPanReady) {
            this.renderer.container.style.cursor = "grab";
          }
          break;
      }
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  private onWheelEvent(e: IWheelData<IWorld>): void {
    const world = e.world as WebWorld;
    const keyboard = world.getPlugin(WebKeyboardPlugin);
    let shiftPressed = false;
    if (keyboard) {
      const status = keyboard.getStatus();
      if (status.ctrlKey || status.metaKey) {
        return;
      }
      shiftPressed = status.shiftKey;
    }
    const { x, y } = getNormalizedWheelDelta(e.e, 25);
    const delta = shiftPressed ? new Point(-y, 0) : new Point(-x, -y);
    this.renderer.globalMove(delta);
  }
  private onKeyboardEvent(e: IKeyboardEmitEvent): void {
    this.inPanReady = e.status.keys.includes(" ");
    if (this.inPanReady) {
      if (!this.inPan) {
        this.renderer.container.style.cursor = "grab";
      }
    } else {
      this.renderer.container.style.cursor = "default";
      this.inPan = false;
    }
  }
}
