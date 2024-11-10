import type { IPointerEvent, PointerEnv } from "@carefree0910/cfb-core";
import type { WebRenderer } from "../renderer.ts";
import type { WebWorld } from "../world.ts";

import { PointerButton, PointerPluginBase } from "@carefree0910/cfb-core";

export class WebPointerPlugin extends PointerPluginBase<WebRenderer, WebWorld> {
  get mobileEnv(): boolean {
    return /(iphone|ipad|android|mobile)/gi.test(navigator.userAgent);
  }
  get pointerEnv(): PointerEnv {
    return this.mobileEnv ? "touch" : "mouse";
  }

  setup(world: WebWorld): void {
    const container = world.renderer.container;
    container.addEventListener(
      !this.mobileEnv ? `pointerdown` : "touchstart",
      (e) => this.queue.push({ e: this.parse(e), env: this.pointerEnv, world }),
    );
    document.addEventListener(
      !this.mobileEnv ? `pointermove` : "touchmove",
      (e) => this.queue.push({ e: this.parse(e), env: this.pointerEnv, world }),
    );
    container.addEventListener(
      !this.mobileEnv ? `pointerup` : "touchend",
      (e) => this.queue.push({ e: this.parse(e), env: this.pointerEnv, world }),
    );
    container.addEventListener("contextmenu", (e) => {
      // right clicks should be handled by `onPointerDown`
      e.preventDefault();
    });
  }

  parse(e: TouchEvent | PointerEvent): IPointerEvent {
    if (e.type === "touchend") {
      return {
        type: "onPointerUp",
        button: PointerButton.LEFT,
      };
    }
    if (e.type === "touchstart" || e.type === "touchmove") {
      e = e as TouchEvent;
      return {
        type: e.type === "touchstart" ? "onPointerDown" : "onPointerMove",
        button: PointerButton.LEFT,
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      };
    }
    e = e as PointerEvent;
    if (
      e.type === "pointerdown" || e.type === "pointermove" || e.type === "pointerup"
    ) {
      return {
        type: e.type === "pointerdown"
          ? "onPointerDown"
          : e.type === "pointermove"
          ? "onPointerMove"
          : "onPointerUp",
        button: e.button,
        clientX: e.clientX,
        clientY: e.clientY,
      };
    }
    throw new Error(`Unknown event type: ${e.type}`);
  }
}
