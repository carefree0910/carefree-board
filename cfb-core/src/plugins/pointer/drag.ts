import type { IPointerData, StopPropagate } from "./base.ts";
import type { Point } from "../../toolkit.ts";
import type { INodeR } from "../../nodes.ts";
import type { IWorld } from "../../world.ts";

import { PointerButton, PointerHandlerBase, registerPointerHandler } from "./base.ts";
import { DirtyStatus, TargetQueue } from "../../renderer.ts";

/**
 * A simple pointer handler that allows to drag the top-most pointed node.
 *
 * > To use this handler, you need to call the `registerDragHandler` function
 * > once and only once in your code.
 */
class DragHandler extends PointerHandlerBase<IWorld> {
  private pointed: INodeR | null = null;
  private pointer: Point | null = null;
  private initialPosition: Point | null = null;

  bind(_: IWorld): void {}

  exec(data: IPointerData<IWorld>): Promise<StopPropagate> {
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
          data.world.setRenderInfo(
            this.pointed.alias,
            {
              dirtyStatus: DirtyStatus.TRANSFORM_DIRTY,
              targetQueue: TargetQueue.IMMEDIATE,
            },
            true,
          );
        }
        break;
      }
      case "onPointerUp": {
        const executer = this.getExecuter(data);
        if (executer && this.pointed && this.initialPosition) {
          executer.exec({
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
    return Promise.resolve(false);
  }

  private reset(): void {
    this.pointed = null;
    this.pointer = null;
    this.initialPosition = null;
  }
}

/**
 * The singleton instance of the drag handler.
 */
export const dragHandler: DragHandler = new DragHandler();
/**
 * Register the {@link dragHandler}.
 */
export function registerDragHandler(): void {
  registerPointerHandler(dragHandler);
}
