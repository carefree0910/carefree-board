import type { IPointerData, IPointerProcessor } from "@carefree0910/cfb-core";
import type { WebWorld } from "../world.ts";

import { Point, registerPointerProcessor } from "@carefree0910/cfb-core";

export class PointerDownProcessor
  implements IPointerProcessor<"onPointerDown", WebWorld> {
  exec({ e, world }: IPointerData<"onPointerDown", WebWorld>): Promise<void> {
    const graph = world.renderer.board.graph;
    const point = new Point(e.clientX, e.clientY);
    const pointed = graph.allSingleNodes.filter((gnode) => point.in(gnode.node.bbox));
    console.log(pointed);
    return Promise.resolve();
  }
}

registerPointerProcessor("onPointerDown", new PointerDownProcessor());
