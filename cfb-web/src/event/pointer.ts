import type { IPointerData, IPointerDownData, IPointerProcessor } from "./base.ts";

import { Point } from "jsr:@carefree0910/cfb-core";
import { registerPointerProcessor } from "./base.ts";

export class PointerProcessor {
  parse(data: IPointerData): TouchList[number] | MouseEvent | PointerEvent {
    if (data.e.type === "touchstart") {
      return (data.e as TouchEvent).touches[0];
    }
    return data.e as MouseEvent | PointerEvent;
  }
}

export class PointerDownProcessor extends PointerProcessor
  implements IPointerProcessor<IPointerDownData> {
  exec(data: IPointerDownData): Promise<void> {
    const e = this.parse(data);
    const graph = data.world.renderer.board.graph;
    const point = new Point(e.clientX, e.clientY);
    const pointed = graph.allSingleNodes.filter((gnode) => point.in(gnode.node.bbox));
    console.log(pointed);
    return Promise.resolve();
  }
}

registerPointerProcessor("onPointerDown", new PointerDownProcessor());
