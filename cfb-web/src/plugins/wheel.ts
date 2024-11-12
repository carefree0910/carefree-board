import type { IWheelEvent } from "@carefree0910/cfb-core";
import type { WebRenderer } from "../renderer.ts";
import type { WebWorld } from "../world.ts";

import { WheelPluginBase } from "@carefree0910/cfb-core";

export class WebWheelPlugin extends WheelPluginBase<WebRenderer, WebWorld> {
  start(world: WebWorld): Promise<void> {
    world.renderer.container.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.queue.push({ e: this.parse(e), world });
      },
      { passive: false },
    );
    return Promise.resolve();
  }

  parse(e: WheelEvent): IWheelEvent {
    return {
      clientX: e.clientX,
      clientY: e.clientY,
      deltaX: e.deltaX,
      deltaY: e.deltaY,
    };
  }
}
