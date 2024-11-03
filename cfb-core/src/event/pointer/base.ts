import type { IEventHandler } from "../types.ts";
import type { IGraphSingleNode } from "../../graph.ts";
import type { IWorld } from "../../world.ts";

import { AsyncQueue, Logger, Point, safeCall } from "../../toolkit.ts";

/**
 * List of pointer event types.
 *
 * @member onPointerDown - Pointer down event.
 * @member onPointerMove - Pointer move event.
 * @member onPointerUp - Pointer up event.
 */
export type PointerEventTypes =
  | "onPointerDown"
  | "onPointerMove"
  | "onPointerUp";
/**
 * List of pointer buttons, inspired by the `PointerEvent.button` property.
 *
 * @member NONE - No pointer.
 * @member LEFT - Left mouse button.
 * @member MIDDLE - Middle mouse button (scroll wheel).
 * @member RIGHT - Right mouse button.
 */
export enum PointerButton {
  NONE = 0,
  LEFT = 1,
  MIDDLE = 2,
  RIGHT = 3,
}
/**
 * A contract for pointer events.
 *
 * @param button - The `PointerButton` that triggered the event.
 * @param clientX - The X coordinate of the pointer event.
 * @param clientY - The Y coordinate of the pointer event.
 */
export interface IPointerEvent {
  button: PointerButton;
  clientX: number;
  clientY: number;
}
/**
 * The pointer data. This will be used to pass data to the pointer processors.
 *
 * @param type - The type of the pointer event.
 * @param e - The pointer event data.
 * @param world - The 'world' instance.
 */
export interface IPointerData<T extends PointerEventTypes, W extends IWorld> {
  type: T;
  e: IPointerEvent;
  world: W;
}

/**
 * A processor for handling pointer events.
 *
 * @method exec Execute the processor with the incoming data.
 */
export interface IPointerProcessor<
  T extends PointerEventTypes,
  W extends IWorld,
  D extends IPointerData<T, W> = IPointerData<T, W>,
> {
  exec(data: D): Promise<void>;
}

const POINTER_PROCESSORS: Record<
  PointerEventTypes,
  IPointerProcessor<PointerEventTypes, IWorld>[]
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
  D extends IPointerData<T, W>,
>(
  type: T,
  processor: IPointerProcessor<T, W, D>,
): void {
  POINTER_PROCESSORS[type].push(processor);
}

/**
 * A (utility) base class for pointer processors.
 *
 * This class provides some utility methods to help the processor to process the pointer events.
 */
export abstract class PointerProcessorBase<
  T extends PointerEventTypes,
  W extends IWorld,
> implements IPointerProcessor<T, W> {
  abstract exec(data: IPointerData<T, W>): Promise<void>;

  protected getPointer(e: IPointerEvent): Point {
    return new Point(e.clientX, e.clientY);
  }
  protected getPointed(
    { e, world }: IPointerData<PointerEventTypes, W>,
  ): IGraphSingleNode[] {
    const graph = world.renderer.board.graph;
    const point = this.getPointer(e);
    return graph.allSingleNodes.filter((gnode) => point.in(gnode.node.bbox));
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
  protected queue: AsyncQueue<IPointerData<PointerEventTypes, W>> = new AsyncQueue<
    IPointerData<PointerEventTypes, W>
  >({
    fn: (data) =>
      safeCall(() => this.pointerEvent(data), {
        success: () => Promise.resolve(),
        failed: (e) => {
          Logger.error(`failed to run pointer event queue : ${data.type}`);
          console.log("> Reason :", e);
          return Promise.resolve();
        },
      }),
  });

  abstract bind(world: W): void;

  private async pointerEvent(data: IPointerData<PointerEventTypes, W>): Promise<void> {
    const processors = POINTER_PROCESSORS[data.type] as IPointerProcessor<
      PointerEventTypes,
      W
    >[];
    const promises = processors.map((processor) => processor.exec(data));
    await Promise.all(promises);
  }

  refresh(): void {}
}
