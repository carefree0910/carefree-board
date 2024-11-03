import type { IPointerEvent } from "@carefree0910/cfb-core";
import type { WebWorld } from "../world.ts";

import { PointerButton, PointerHandlerBase } from "@carefree0910/cfb-core";

export class WebPointerHandler extends PointerHandlerBase<WebWorld> {
  get mobileEnv(): boolean {
    return /(iphone|ipad|android|mobile)/gi.test(navigator.userAgent);
  }

  bind(world: WebWorld): void {
    const container = world.renderer.container;
    container.addEventListener(
      !this.mobileEnv ? `pointerdown` : "touchstart",
      (e) => this.queue.push({ type: "onPointerDown", e: this.parse(e), world }),
    );
    document.addEventListener(
      !this.mobileEnv ? `pointermove` : "touchmove",
      (e) => this.queue.push({ type: "onPointerMove", e: this.parse(e), world }),
    );
    container.addEventListener(
      !this.mobileEnv ? `pointerup` : "touchend",
      (e) => this.queue.push({ type: "onPointerUp", e: this.parse(e), world }),
    );
    container.addEventListener("contextmenu", (e) => {
      // right clicks should be handled by `onPointerDown`
      e.preventDefault();
    });
  }

  parse(e: TouchEvent | PointerEvent): IPointerEvent {
    if (e.type === "touchstart") {
      e = e as TouchEvent;
      return {
        button: PointerButton.LEFT,
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      };
    }
    e = e as PointerEvent;
    return {
      button: e.button,
      clientX: e.clientX,
      clientY: e.clientY,
    };
  }
}
