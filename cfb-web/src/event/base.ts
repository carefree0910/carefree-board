import type { IEventHandler } from "jsr:@carefree0910/cfb-core";
import type { WebWorld } from "../world.ts";

import { AsyncQueue, Logger, safeCall } from "jsr:@carefree0910/cfb-core";

// base

export abstract class WebEventHandlerBase implements IEventHandler {
  abstract bind(world: WebWorld): void;
  refresh(): void {}
}

// pointer

export type PointerEventTypes =
  | "onPointerDown"
  | "onPointerMove"
  | "onPointerUp"
  | "onContextMenu";
export interface IPointerDownData {
  type: "onPointerDown";
  e: PointerEvent | TouchEvent;
  world: WebWorld;
}
export interface IPointerMoveData {
  type: "onPointerMove";
  e: PointerEvent | TouchEvent;
  world: WebWorld;
}
export interface IPointerUpData {
  type: "onPointerUp";
  e: PointerEvent | TouchEvent;
  world: WebWorld;
}
export interface IContextMenuEventData {
  type: "onContextMenu";
  e: MouseEvent;
  world: WebWorld;
}
export type IPointerData =
  | IPointerDownData
  | IPointerMoveData
  | IPointerUpData
  | IContextMenuEventData;
export interface IPointerProcessor<D extends IPointerData = IPointerData> {
  exec(data: D): Promise<void>;
}

const POINTER_PROCESSORS: Record<PointerEventTypes, IPointerProcessor[]> = {
  onPointerDown: [],
  onPointerMove: [],
  onPointerUp: [],
  onContextMenu: [],
};

export function registerPointerProcessor<D extends IPointerData>(
  type: D["type"],
  processor: IPointerProcessor<D>,
): void {
  POINTER_PROCESSORS[type].push(processor);
}
export class PointerHandler extends WebEventHandlerBase {
  queue: AsyncQueue<IPointerData> = new AsyncQueue<IPointerData>({
    fn: (data) =>
      safeCall(() => this.pointerEvent(data), {
        success: () => Promise.resolve(),
        failed: (e) => {
          Logger.error(`failed to run pointer event queue : ${data.type}`);
          console.log("> Reason :", e);
          return Promise.resolve();
        },
      }),
  });

  get mobileEnv(): boolean {
    return /(iphone|ipad|android|mobile)/gi.test(navigator.userAgent);
  }

  bind(world: WebWorld): void {
    const container = world.renderer.container;
    container.addEventListener(
      !this.mobileEnv ? `pointerdown` : "touchstart",
      (e) => this.queue.push({ type: "onPointerDown", e, world }),
    );
    document.addEventListener(
      !this.mobileEnv ? `pointermove` : "touchmove",
      (e) => this.queue.push({ type: "onPointerMove", e, world }),
    );
    container.addEventListener(
      !this.mobileEnv ? `pointermove` : "touchmove",
      (e) => this.queue.push({ type: "onPointerMove", e, world }),
    );
    container.addEventListener(
      !this.mobileEnv ? `pointerup` : "touchend",
      (e) => this.queue.push({ type: "onPointerUp", e, world }),
    );
    container.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.queue.push({ type: "onContextMenu", e, world });
    });
  }

  private async pointerEvent(data: IPointerData): Promise<void> {
    const processors = POINTER_PROCESSORS[data.type];
    const promises = processors.map((processor) => processor.exec(data));
    await Promise.all(promises);
  }
}
