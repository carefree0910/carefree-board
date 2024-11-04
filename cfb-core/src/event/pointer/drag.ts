import type { IPointerData } from "./base.ts";
import type { Point } from "../../toolkit.ts";
import type { ISingleNodeR } from "../../nodes.ts";
import type { IWorld } from "../../world.ts";

import {
  PointerButton,
  PointerProcessorBase,
  registerPointerProcessor,
} from "./base.ts";
import { DirtyStatus } from "../../board.ts";

/**
 * A simple pointer processor that allows to drag the top-most pointed node.
 *
 * > To use this processor, you need to call the `registerDragProcessor` function
 * > once and only once in your code.
 */
class DragProcessor extends PointerProcessorBase<IWorld> {
  private pointer: Point | null = null;
  private pointed: ISingleNodeR | null = null;

  exec(data: IPointerData<IWorld>): Promise<void> {
    switch (data.e.type) {
      case "onPointerDown": {
        if (data.e.button !== PointerButton.LEFT) {
          break;
        }
        const allPointed = this.getPointed(data);
        if (allPointed.length === 0) {
          this.reset();
        } else {
          this.pointer = this.getPointer(data);
          this.pointed = allPointed.sort((a, b) => a.node.z - b.node.z)[0].node;
        }
        break;
      }
      case "onPointerMove": {
        if (this.pointer && this.pointed) {
          const newPointer = this.getPointer(data);
          this.pointed.position = this.pointed.lt.add(newPointer.subtract(this.pointer));
          this.pointer = newPointer;
          data.world.setDirtyStatus(this.pointed.alias, DirtyStatus.TRANSFORM_DIRTY);
        }
        break;
      }
      case "onPointerUp": {
        this.reset();
        break;
      }
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
