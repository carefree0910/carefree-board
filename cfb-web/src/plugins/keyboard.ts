import type { IKeyboardEvent } from "@carefree0910/cfb-core";
import type { WebRenderer } from "../renderer.ts";
import type { WebWorld } from "../world.ts";

import { KeyboardPluginBase } from "@carefree0910/cfb-core";

export class WebKeyboardPlugin extends KeyboardPluginBase<WebRenderer, WebWorld> {
  start(world: WebWorld): Promise<void> {
    document.addEventListener(
      "keydown",
      (e) => this.queue.push({ e: this.parse(e), world }),
    );
    document.addEventListener(
      "keyup",
      (e) => this.queue.push({ e: this.parse(e), world }),
    );
    return Promise.resolve();
  }

  parse(e: KeyboardEvent): IKeyboardEvent {
    return {
      type: e.type === "keydown" ? "onKeyDown" : "onKeyUp",
      key: e.key,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      shiftKey: e.shiftKey,
    };
  }
}
