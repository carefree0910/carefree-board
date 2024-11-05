import type { IEventHandler } from "../types.ts";
import type { IGraphSingleNode } from "../../graph.ts";
import type { IWorld } from "../../world.ts";

import { AsyncQueue, Logger, Point, safeCall } from "../../toolkit.ts";
import { ExecuterPlugin } from "../../plugins.ts";

/**
 * List of pointer buttons, inspired by the `PointerEvent.button` property.
 */
export enum PointerButton {
  /**
   * No pointer.
   */
  NONE = -1,
  /**
   * Left mouse button.
   */
  LEFT = 0,
  /**
   * Middle mouse button (scroll wheel).
   */
  MIDDLE = 1,
  /**
   * Right mouse button.
   */
  RIGHT = 2,
}
/**
 * A contract for pointer events.
 *
 * - `button` - The `PointerButton` that triggered the event.
 * - `clientX` - The X coordinate of the pointer event.
 * > Since `TouchEvent` does not have this property at `touchend`, it is optional in `onPointerUp`.
 * - `clientY` - The Y coordinate of the pointer event.
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
 * @template W Type of the `world` instance.
 */
export interface IPointerData<W extends IWorld> {
  /**
   * The pointer event data.
   */
  e: IPointerEvent;
  /**
   * The `world` instance.
   */
  world: W;
}

/**
 * List of pointer event types.
 *
 * - `onPointerDown` - Pointer down event.
 * - `onPointerMove` - Pointer move event.
 * - `onPointerUp` - Pointer up event.
 */
export type PointerEventType = IPointerEvent["type"];
/**
 * Type alias for `boolean` to indicate whether the pointer event should be stopped
 * propagating at current processor.
 *
 * This is useful when you want to prevent the event from being processed by subsequent
 * processors, pretty much like `event.stopPropagation()` in the DOM event handling.
 */
export type StopPropagate = boolean;

/**
 * A processor for handling pointer events.
 *
 * See {@link PointerHandlerBase} for the overall design of pointer event handling.
 */
export interface IPointerProcessor<
  W extends IWorld,
  D extends IPointerData<W> = IPointerData<W>,
> {
  /**
   * Execute the processor with the incoming data, and return whether the event should
   * be stopped propagating.
   *
   * @param data The incoming data.
   * @returns A promise that resolves to a boolean value indicating whether the event
   * should be stopped propagating.
   */
  exec(data: D): Promise<StopPropagate>;
}

const POINTER_PROCESSORS: Record<
  PointerEventType,
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
  T extends PointerEventType,
  W extends IWorld,
  D extends IPointerData<W>,
>(type: T, processor: IPointerProcessor<W, D>): void {
  POINTER_PROCESSORS[type].push(processor);
}

/**
 * A (utility) base class for pointer processors.
 *
 * This class provides some utility methods to help the processor to process the pointer events.
 *
 * See {@link PointerHandlerBase} for the overall design of pointer event handling.
 */
export abstract class PointerProcessorBase<W extends IWorld>
  implements IPointerProcessor<W> {
  /**
   * Execute the processor with the incoming data, and return whether the event should
   * be stopped propagating.
   *
   * @param data The incoming data.
   * @returns A promise that resolves to a boolean value indicating whether the event
   * should be stopped propagating.
   */
  abstract exec(data: IPointerData<W>): Promise<StopPropagate>;

  protected getPointer({ e }: IPointerData<W>): Point {
    if (e.type === "onPointerUp") {
      throw new Error("Cannot get pointer from 'onPointerUp' event.");
    }
    return new Point(e.clientX, e.clientY!);
  }
  /**
   * Get the pointed node(s) at the current pointer position.
   *
   * @param data The pointer data.
   * @param sort Whether to sort the pointed nodes by their z-index, default is `true`.
   * > If `true`, the first element in the returned array will be the top-most node.
   * @returns The pointed node(s).
   */
  protected getPointed(data: IPointerData<W>, sort: boolean = true): IGraphSingleNode[] {
    const graph = data.world.renderer.board.graph;
    const point = this.getPointer(data);
    const nodes = graph.allSingleNodes.filter((gnode) => point.in(gnode.node.bbox));
    if (sort) {
      nodes.sort((a, b) => a.node.z - b.node.z);
    }
    return nodes;
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
 * A general flow of the pointer event handling is as follows:
 *
 * 1. The pointer event is triggered.
 * 2. The event is 'parsed' into {@link IPointerData}, and then sent to the `queue`.
 * > Notice that it is the subclass's responsibility to do the parsing & sending,
 * > see `WebPointerHandler` defined in `cfb-web` module for a concrete example.
 * 3. The `queue` will process the event sequentially, calling `pointerEvent` method on
 *    each event.
 * 4. The `pointerEvent` method will call the `exec` method of each {@link IPointerProcessor} in
 *    the order of registration.
 *
 * > Notice that this class is **NOT** 'the only way' to handle pointer events - it's just
 * > an example, and you can implement your own pointer handlers!
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

  /**
   * This method should setup bindings with the given `world`.
   *
   * > For example, in a web `world`, this method should bind the corresponding event listeners.
   *
   * @param world The `world` instance to bind.
   */
  abstract bind(world: W): void;

  private async pointerEvent(data: IPointerData<W>): Promise<void> {
    const processors = POINTER_PROCESSORS[data.e.type];
    for (const processor of processors) {
      if (await processor.exec(data)) {
        break;
      }
    }
  }

  /**
   * Placeholder.
   */
  refresh(): void {}
}
