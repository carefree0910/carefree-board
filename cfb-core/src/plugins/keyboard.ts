import type { IPlugin } from "./types.ts";
import type { IRenderer } from "../renderer.ts";
import type { IWorld } from "../world.ts";

import { AsyncQueue, Event, Logger, safeCall } from "../toolkit.ts";

/**
 * List of keyboard event types.
 *
 * - `onKeyDown` - Keyboard down event.
 * - `onKeyUp` - Keyboard up event.
 *
 * > Notice that this only serves the `keyboard` plugin defined by us, and you are free
 * > to completely ignore this and implement your own!
 */
export type KeyboardEventType = "onKeyDown" | "onKeyUp";
/**
 * Status of special keys.
 *
 * - `altKey` - Whether the `Alt` key is pressed.
 * - `ctrlKey` - Whether the `Ctrl` key is pressed.
 * - `metaKey` - Whether the `Meta` key is pressed.
 * - `shiftKey` - Whether the `Shift` key is pressed.
 */
export interface IKeyboardSpecialStatus {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}
/**
 * A contract for keyboard events.
 *
 * - `type` - The type of the keyboard event.
 * - `key` - The key that triggered the event, borrowed from {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key}.
 *
 * > Notice that this only serves the `keyboard` plugin defined by us, and you are free
 * > to completely ignore this and implement your own!
 */
export interface IKeyboardEvent extends IKeyboardSpecialStatus {
  type: KeyboardEventType;
  key: string;
}
/**
 * The keyboard data. This will be used to pass data to the keyboard handlers.
 *
 * > Notice that this only serves the `keyboard` plugin defined by us, and you are free
 * > to completely ignore this and implement your own!
 *
 * @template W Type of the `world` instance.
 */
export interface IKeyboardData<W extends IWorld> {
  /**
   * The keyboard event data.
   */
  e: IKeyboardEvent;
  /**
   * The `world` instance.
   */
  world: W;
}

/**
 * The current status of the keyboard.
 *
 * - `keys` - The list of keys that are currently pressed and held.
 */
export interface IKeyboardStatus extends IKeyboardSpecialStatus {
  keys: Set<string>;
}

export interface IKeyboardEmitEvent {
  type: KeyboardEventType;
  status: IKeyboardSpecialStatus & { keys: string[] };
  world: IWorld;
}
type KeyboardEvent = Event<IKeyboardEmitEvent>;
export const keyboardEvent: KeyboardEvent = new Event();

/**
 * The base class for plugins that handle keyboard events.
 *
 * This class mainly does two things:
 *
 * 1. Maintains the current status of the keyboard.
 * 2. Emits the keyboard events with the event type and the current status when a key is
 *    pressed or released.
 *
 * > Notice that this keyboard plugin is **NOT** the only way to handle keyboard events
 * > - it's just an example, and you can implement your own keyboard handling plugin!
 */
export abstract class KeyboardPluginBase<R extends IRenderer, W extends IWorld<R>>
  implements IPlugin<R> {
  private status: IKeyboardStatus = {
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    keys: new Set<string>(),
  };
  protected queue: AsyncQueue<IKeyboardData<W>> = new AsyncQueue<IKeyboardData<W>>({
    fn: (data) =>
      safeCall(() => this.keyboardEvent(data), {
        success: () => Promise.resolve(),
        failed: (e) => {
          Logger.error(`failed to run keyboard event queue : ${data.e.type}`);
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

  private keyboardEvent(data: IKeyboardData<W>): Promise<void> {
    this.status.altKey = data.e.altKey;
    this.status.ctrlKey = data.e.ctrlKey;
    this.status.metaKey = data.e.metaKey;
    this.status.shiftKey = data.e.shiftKey;
    if (data.e.type === "onKeyDown") {
      this.status.keys.add(data.e.key);
    } else {
      this.status.keys.delete(data.e.key);
    }
    const keys = Array.from(this.status.keys);
    keyboardEvent.emit({
      type: data.e.type,
      status: { ...this.status, keys },
      world: data.world,
    });
    return Promise.resolve();
  }
}

/**
 * Check whether the emitted event (exactly) contains the given keys.
 *
 * Useful for checking whether the user is pressing a certain combination of keys.
 */
export function checkKeys(e: IKeyboardEmitEvent, keys: string[]): boolean {
  const statusKeys = e.status.keys;
  if (keys.length !== statusKeys.length) {
    return false;
  }
  return keys.every((key) => e.status.keys.includes(key));
}
