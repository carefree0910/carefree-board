import type { IPointerData, StopPropagate } from "./base.ts";
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
  private pointed: ISingleNodeR | null = null;
  private pointer: Point | null = null;
  private initialPosition: Point | null = null;

  bind(_: IWorld): void {}

  async exec(data: IPointerData<IWorld>): Promise<StopPropagate> {
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
          this.pointed = allPointed[0].node;
          this.initialPosition = this.pointed.lt;
        }
        break;
      }
      case "onPointerMove": {
        if (this.pointer && this.pointed) {
          const newPointer = this.getPointer(data);
          this.pointed.position = this.pointed.lt.add(newPointer.subtract(this.pointer));
          this.pointer = newPointer;
          data.world.setDirtyStatus(
            this.pointed.alias,
            DirtyStatus.TRANSFORM_DIRTY,
            true,
          );
        }
        break;
      }
      case "onPointerUp": {
        const executer = this.getExecuter(data);
        if (executer && this.pointed && this.initialPosition) {
          await executer.exec({
            type: "moveTo",
            prev: {
              [this.pointed.alias]: {
                position: this.initialPosition.plain,
              },
            },
            next: {
              [this.pointed.alias]: {
                position: this.pointed.lt.plain,
              },
            },
          });
        }
        this.reset();
        break;
      }
    }
    return false;
  }

  private reset(): void {
    this.pointed = null;
    this.pointer = null;
    this.initialPosition = null;
  }
}

/**
 * The singleton instance of the drag processor.
 */
export const dragProcessor: DragProcessor = new DragProcessor();
/**
 * Register the {@link dragProcessor} to all {@link PointerEventType}.
 *
 * > Notice that this processor may conflict with other processors, so if you need a
 * > fine-grained control of the processors' execution order, you may need to register
 * > {@link dragProcessor} manually with the {@link registerPointerProcessor} function.
 */
export function registerDragProcessor(): void {
  registerPointerProcessor("onPointerDown", dragProcessor);
  registerPointerProcessor("onPointerMove", dragProcessor);
  registerPointerProcessor("onPointerUp", dragProcessor);
}
