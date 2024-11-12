import type { WebWorld } from "../world.ts";

import { Point, wheelEvent } from "@carefree0910/cfb-core";
import { getNormalizedWheelDelta } from "./utils.ts";
import { WebKeyboardPlugin } from "./keyboard.ts";

wheelEvent.on((e) => {
  const world = e.world as WebWorld;
  const keyboard = world.getPlugin(WebKeyboardPlugin);
  if (keyboard) {
    const status = keyboard.getStatus();
    if (status.ctrlKey || status.metaKey) {
      const deltaY = getNormalizedWheelDelta(e.e, 25).y;
      const { left, top } = world.renderer.container.getBoundingClientRect();
      const pointer = new Point(e.e.clientX - left, e.e.clientY - top);
      world.renderer.globalScale(1.0 - deltaY * 0.01, pointer);
    }
  }
});
