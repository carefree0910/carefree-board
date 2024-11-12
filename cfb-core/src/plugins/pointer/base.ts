import type { IPlugin } from "../types.ts";
import type { INodeR } from "../../nodes.ts";
import type { IGraphNode } from "../../graph.ts";
import type { IRenderer } from "../../renderer.ts";
import type { IWorld } from "../../world.ts";

import { AsyncQueue, isUndefined, Logger, Point, safeCall } from "../../toolkit.ts";
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
 * > Since `TouchEvent` doesn't have this at `touchend`, it's' not defined in `onPointerUp`.
 * - `clientY` - The Y coordinate of the pointer event.
 * > Since `TouchEvent` doesn't have this at `touchend`, it's' not defined in `onPointerUp`.
 *
 * > Notice that this only serves the `pointer` plugin defined by us, and you are free
 * > to completely ignore this and implement your own!
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
 * List of pointer environments.
 *
 * It should be safe to always use `mouse`, but specifying this can be helpful for other plugins.
 *
 * - `mouse` - Mouse pointer, often used in desktop environments.
 * - `touch` - Touch pointer, often used in mobile environments.
 *
 * > Notice that this only serves the `pointer` plugin defined by us, and you are free
 * > to completely ignore this and implement your own!
 */
export type PointerEnv = "mouse" | "touch";
/**
 * The pointer data. This will be used to pass data to the pointer handlers.
 *
 * > Notice that this only serves the `pointer` plugin defined by us, and you are free
 * > to completely ignore this and implement your own!
 *
 * @template W Type of the `world` instance.
 */
export interface IPointerData<W extends IWorld> {
  /**
   * The pointer event data.
   */
  e: IPointerEvent;
  /**
   * The environment of the pointer.
   */
  env: PointerEnv;
  /**
   * The `world` instance.
   */
  world: W;
}

/**
 * Type alias for `boolean` to indicate whether the pointer event should be stopped
 * propagating at current handler.
 *
 * This is useful when you want to prevent the event from being processed by subsequent
 * handlers, pretty much like `event.stopPropagation()` in the DOM event handling.
 */
export type StopPropagate = boolean;

/**
 * A handler for handling pointer events.
 *
 * See {@link PointerPluginBase} for the overall design of pointer event handling.
 */
export interface IPointerHandler<
  W extends IWorld,
  D extends IPointerData<W> = IPointerData<W>,
> {
  /**
   * Bind the handler with the given `world`.
   */
  bind(world: W): void;
  /**
   * Execute the handler with the incoming data, and return whether the event should
   * be stopped propagating.
   */
  exec(data: D): Promise<StopPropagate>;
}

const POINTER_HANDLERS: IPointerHandler<IWorld>[] = [];
/**
 * Get (a shallow copy of) the registered pointer handlers.
 */
export function getPointerHandlers(): IPointerHandler<IWorld>[] {
  return [...POINTER_HANDLERS];
}
/**
 * Register a pointer handler, so it will be used in the `pointer` plugin.
 */
export function registerPointerHandler<W extends IWorld, D extends IPointerData<W>>(
  handler: IPointerHandler<W, D>,
): void {
  POINTER_HANDLERS.push(handler);
}

/**
 * A (utility) base class for pointer handlers.
 *
 * This class provides some utility methods to help the handler to process the pointer events.
 *
 * See {@link PointerPluginBase} for the overall design of pointer event handling.
 */
export abstract class PointerHandlerBase<W extends IWorld>
  implements IPointerHandler<W> {
  /**
   * Bind the handler with the given `world`.
   */
  abstract bind(world: W): void;
  /**
   * Execute the handler with the incoming data, and return whether the event should
   * be stopped propagating.
   */
  abstract exec(data: IPointerData<W>): Promise<StopPropagate>;

  protected getPointer({ e }: IPointerData<IWorld>): Point {
    if (e.type === "onPointerUp") {
      throw new Error("Cannot get pointer from 'onPointerUp' event.");
    }
    return new Point(e.clientX, e.clientY!);
  }
  protected isPointed(data: IPointerData<IWorld>, node: INodeR): boolean {
    return this.getPointer(data).in(node.bbox);
  }
  /**
   * Get the pointed node(s) at the current pointer position.
   *
   * @param data The pointer data.
   * @param sort Whether to sort the pointed nodes by their z-index, default is `true`.
   * > If `true`, the first element in the returned array will be the top-most node.
   * @returns The pointed node(s).
   */
  protected getPointed(data: IPointerData<IWorld>, sort: boolean = true): IGraphNode[] {
    const graph = data.world.renderer.graph;
    const point = this.getPointer(data);
    const nodes = graph.allNodes.filter((gnode) => point.in(gnode.node.bbox));
    if (sort) {
      nodes.sort((a, b) => a.node.z - b.node.z);
    }
    return nodes;
  }
  protected getExecuter(data: IPointerData<IWorld>): ExecuterPlugin | null {
    return data.world.getPlugin(ExecuterPlugin);
  }
}

/**
 * A base class for plugins that handle pointer events.
 *
 * This class is a thin wrapper around {@link IPointerHandler}s, and will call the
 * handlers with an `AsyncQueue` to ensure that the event is handled sequentially.
 *
 * A general flow of the pointer event handling is as follows:
 *
 * 1. The pointer event is triggered.
 * 2. The event is 'parsed' into {@link IPointerData}, and then sent to the `queue`.
 * > Notice that it is the subclass's responsibility to do the parsing & sending,
 * > see `WebPointerHandler` defined in `cfb-web` module for a concrete example.
 * 3. The `queue` will handle the event sequentially, calling `pointerEvent` method on
 *    each event.
 * 4. The `pointerEvent` method will call the `exec` method of each {@link IPointerHandler}
 *    in the order of registration.
 *
 * > Notice that this plugin base class is **NOT** the only way to handle pointer events
 * > - it's just an example, and you can implement your own pointer handling plugin!
 */
export abstract class PointerPluginBase<R extends IRenderer, W extends IWorld<R>>
  implements IPlugin<R> {
  private _world?: W;
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
  abstract setup(world: W): void;

  get world(): W {
    if (isUndefined(this._world)) {
      throw new Error("The pointer handler is not bound to any world.");
    }
    return this._world;
  }

  start(world: W): Promise<void> {
    this._world = world;
    this.setup(world);
    for (const handler of POINTER_HANDLERS) {
      handler.bind(world);
    }
    return Promise.resolve();
  }

  private async pointerEvent(data: IPointerData<W>): Promise<void> {
    for (const handler of POINTER_HANDLERS) {
      if (await handler.exec(data)) {
        break;
      }
    }
  }
}
