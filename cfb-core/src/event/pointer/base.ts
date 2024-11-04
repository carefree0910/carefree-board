import type { IEventHandler } from "../types.ts";
import type { IGraphSingleNode } from "../../graph.ts";
import type { IWorld } from "../../world.ts";

import { AsyncQueue, Logger, Point, safeCall } from "../../toolkit.ts";
import { ExecuterPlugin } from "../../plugins.ts";

/**
 * List of pointer buttons, inspired by the `PointerEvent.button` property.
 *
 * @member NONE - No pointer.
 * @member LEFT - Left mouse button.
 * @member MIDDLE - Middle mouse button (scroll wheel).
 * @member RIGHT - Right mouse button.
 */
export enum PointerButton {
  NONE = -1,
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
}
/**
 * A contract for pointer events.
 *
 * @param button - The `PointerButton` that triggered the event.
 * @param clientX - The X coordinate of the pointer event.
 * > Since `TouchEvent` does not have this property at `touchend`, it is optional in `onPointerUp`.
 * @param clientY - The Y coordinate of the pointer event.
 * > Since `TouchEvent` does not have this property at `touchend`, it is optional in `onPointerUp`.
 */
export type IPointerEvent = {
  type: "onPointerDown";
  button: PointerButton;
  clientX: number;
  clientY: number;
} | {
  type: "onPointerMove";
  button: PointerButton;
  clientX: number;
  clientY: number;
} | {
  type: "onPointerUp";
  button: PointerButton;
};
/**
 * The pointer data. This will be used to pass data to the pointer processors.
 *
 * @param type - The type of the pointer event.
 * @param e - The pointer event data.
 * @param world - The 'world' instance.
 */
export interface IPointerData<W extends IWorld> {
  e: IPointerEvent;
  world: W;
}

/**
 * List of pointer event types.
 *
 * @member onPointerDown - Pointer down event.
 * @member onPointerMove - Pointer move event.
 * @member onPointerUp - Pointer up event.
 */
export type PointerEventTypes = IPointerEvent["type"];

/**
 * A processor for handling pointer events.
 *
 * @method exec Execute the processor with the incoming data.
 */
export interface IPointerProcessor<
  W extends IWorld,
  D extends IPointerData<W> = IPointerData<W>,
> {
  exec(data: D): Promise<void>;
}

const POINTER_PROCESSORS: Record<
  PointerEventTypes,
  IPointerProcessor<IWorld>[]
> = {
  onPointerDown: [],
  onPointerMove: [],
  onPointerUp: [],
};
/**
 * Register a pointer processor, so it will be used in the pointer handler.
 *
 * @param type The type of the pointer event that the processor will handle.
 * @param processor The processor to be registered.
 */
export function registerPointerProcessor<
  T extends PointerEventTypes,
  W extends IWorld,
  D extends IPointerData<W>,
>(type: T, processor: IPointerProcessor<W, D>): void {
  POINTER_PROCESSORS[type].push(processor);
}

/**
 * A (utility) base class for pointer processors.
 *
 * This class provides some utility methods to help the processor to process the pointer events.
 */
export abstract class PointerProcessorBase<W extends IWorld>
  implements IPointerProcessor<W> {
  abstract exec(data: IPointerData<W>): Promise<void>;

  protected getPointer({ e }: IPointerData<W>): Point {
    if (e.type === "onPointerUp") {
      throw new Error("Cannot get pointer from 'onPointerUp' event.");
    }
    return new Point(e.clientX, e.clientY!);
  }
  protected getPointed(data: IPointerData<W>): IGraphSingleNode[] {
    const graph = data.world.renderer.board.graph;
    const point = this.getPointer(data);
    return graph.allSingleNodes.filter((gnode) => point.in(gnode.node.bbox));
  }
  protected getExecuter(data: IPointerData<W>): ExecuterPlugin | null {
    for (const plugin of data.world.plugins) {
      if (plugin instanceof ExecuterPlugin) {
        return plugin;
      }
    }
    return null;
  }
}

/**
 * A base class for handling pointer events.
 *
 * This class is a thin wrapper around pointer processors, and will call the processors
 * with an `AsyncQueue` to ensure that the event is processed sequentially.
 *
 * @method bind This method should setup bindings with the given 'world'.
 * > For example, in a web 'world', this method should bind the corresponding event listeners.
 * @method refresh Placeholder.
 */
export abstract class PointerHandlerBase<W extends IWorld> implements IEventHandler {
  protected queue: AsyncQueue<IPointerData<W>> = new AsyncQueue<IPointerData<W>>({
    fn: (data) =>
      safeCall(() => this.pointerEvent(data), {
        success: () => Promise.resolve(),
        failed: (e) => {
          Logger.error(`failed to run pointer event queue : ${data.e.type}`);
          console.log("> Reason :", e);
          return Promise.resolve();
        },
      }),
  });

  abstract bind(world: W): void;

  private async pointerEvent(data: IPointerData<W>): Promise<void> {
    const processors = POINTER_PROCESSORS[data.e.type];
    /** @todo specify priority */
    for (const processor of processors) {
      await processor.exec(data);
    }
  }

  refresh(): void {}
}
