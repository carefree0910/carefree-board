import type { IPointerData, PointerEventTypes } from "./base.ts";
import type { Point } from "../../toolkit.ts";
import type { ISingleNodeR } from "../../nodes.ts";
import type { IWorld } from "../../world.ts";

import { PointerProcessorBase, registerPointerProcessor } from "./base.ts";
import { DirtyStatus } from "../../board.ts";

/**
 * A simple pointer processor that allows to drag the top-most pointed node.
 *
 * > To use this processor, you need to call the `registerDragProcessor` function
 * > once and only once in your code.
 */
class DragProcessor extends PointerProcessorBase<PointerEventTypes, IWorld> {
  private pointer: Point | null = null;
  private pointed: ISingleNodeR | null = null;

  exec(data: IPointerData<PointerEventTypes, IWorld>): Promise<void> {
    if (data.type === "onPointerDown") {
      const allPointed = this.getPointed(data);
      if (allPointed.length === 0) {
        this.reset();
      } else {
        this.pointer = this.getPointer(data.e);
        this.pointed = allPointed.sort((a, b) => a.node.z - b.node.z)[0].node;
      }
    } else if (data.type === "onPointerMove") {
      if (this.pointer && this.pointed) {
        const newPointer = this.getPointer(data.e);
        this.pointed.position = this.pointed.lt.add(newPointer.subtract(this.pointer));
        this.pointer = newPointer;
        data.world.renderer.board.get(this.pointed.alias).setDirtyStatus(
          DirtyStatus.TRANSFORM_DIRTY,
        );
      }
    } else if (data.type === "onPointerUp") {
      this.reset();
    }
    return Promise.resolve();
  }

  private reset(): void {
    this.pointed = null;
    this.pointer = null;
  }
}

const dragProcessor: DragProcessor = new DragProcessor();
/**
 * Register the drag processor.
 *
 * > Notice that this processor may conflict with other processors, so register
 * > the ones that you need!
 */
export function registerDragProcessor(): void {
  registerPointerProcessor("onPointerDown", dragProcessor);
  registerPointerProcessor("onPointerMove", dragProcessor);
  registerPointerProcessor("onPointerUp", dragProcessor);
}
