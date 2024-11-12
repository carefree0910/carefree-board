import type { IPlugin } from "./types.ts";
import type { IRenderer } from "../renderer.ts";
import type { IWorld } from "../world.ts";

import { AsyncQueue, Event, Logger, safeCall } from "../toolkit.ts";

/**
 * A contract for wheel events.
 *
 * - `clientX` - The X coordinate of the pointer event.
 * - `clientY` - The Y coordinate of the pointer event.
 * - `deltaX` - The horizontal scroll amount.
 * - `deltaY` - The vertical scroll amount.
 *
 * > Notice that this only serves the `wheel` plugin defined by us, and you are free
 * > to completely ignore this and implement your own!
 */
export interface IWheelEvent {
  clientX: number;
  clientY: number;
  deltaX: number;
  deltaY: number;
}
/**
 * The wheel data. This will be used to pass data to the wheel handlers.
 *
 * > Notice that this only serves the `wheel` plugin defined by us, and you are free
 * > to completely ignore this and implement your own!
 *
 * @template W Type of the `world` instance.
 */
export interface IWheelData<W extends IWorld> {
  /**
   * The wheel event data.
   */
  e: IWheelEvent;
  /**
   * The `world` instance.
   */
  world: W;
}
type WheelEvent = Event<IWheelData<IWorld> & { type: "wheel" }>;
export const wheelEvent: WheelEvent = new Event();

/**
 * The base class for plugins that handle wheel events.
 *
 * This class will emit the wheel events with the event data.
 *
 * > Notice that this wheel plugin is **NOT** the only way to handle wheel events - it's
 * > just an example, and you can implement your own wheel handling plugin!
 */
export abstract class WheelPluginBase<R extends IRenderer, W extends IWorld<R>>
  implements IPlugin<R> {
  protected queue: AsyncQueue<IWheelData<W>> = new AsyncQueue<IWheelData<W>>({
    fn: (data) =>
      safeCall(() => this.wheelEvent(data), {
        success: () => Promise.resolve(),
        failed: (e) => {
          Logger.error(`failed to run wheel event queue : ${data.e}`);
          console.log("> Reason :", e);
          return Promise.resolve();
        },
      }),
  });

  /**
   * This method should setup bindings with the given `world`.
   *
   * > For example, in a web `world`, this method should bind the corresponding
   * > event listeners.
   */
  abstract start(world: W): Promise<void>;

  private wheelEvent(data: IWheelData<W>): Promise<void> {
    wheelEvent.emit({ type: "wheel", ...data });
    return Promise.resolve();
  }
}
