import { Context } from "./context.ts";

/**
 * The data carried by an event.
 */
export interface IEventData {
  type: string;
}
/**
 * A listener that listens to a specific event.
 *
 * See {@link IEvent} for the overall design of general event listening.
 */
export interface Listener<D extends IEventData> {
  (event: D): void;
}
/**
 * The disposable interface.
 *
 * See {@link IEvent} for the overall design of general event listening.
 */
export interface IDispose {
  dispose: () => void;
}
/**
 * The interface of a general event system.
 *
 * Different from {@link IEventSystem}, this provides a general event listening
 * mechanism, which is a unique tool and can be used freely by other layers.
 */
export interface IEvent<D extends IEventData> {
  /**
   * Add a 'long-term' listener, which will be called every time the event is emitted.
   * Calling `on` will return a {@link IDispose} object, so caller can use its `dispose`
   * method to remove the listener.
   */
  on(listener: Listener<D>): IDispose;
  /**
   * Add a listener that will be removed after the first time it is called.
   */
  once(listener: Listener<D>): void;
  /**
   * Remove a listener. This is basically what the `dispose` method of the
   * {@link IDispose} object does.
   */
  off(listener: Listener<D>): void;
  /**
   * Emit an event, which will trigger all (existing) listeners.
   */
  emit(event: D): void;
  /**
   * Focus on a specific set of events, which means only listeners of these events will
   * be triggered within the scope of the `fn` function.
   */
  focus<R>(fn: () => R, ...events: D["type"][]): R;
}

/**
 * A basic implementation of {@link IEvent}.
 *
 * Typical usage is to 'realize' type `D` into a specific event type:
 *
 * ```ts
 * type MyEvent = Event<{ type: "my-event"; data: string }>;
 * const myEvent: MyEvent = new Event();
 * console.log(myEvent);
 * ```
 */
export class Event<D extends IEventData> implements IEvent<D> {
  private _focus: Set<D["type"]> | null = null;
  private listeners: Listener<D>[] = [];
  private onceListeners: Listener<D>[] = [];

  on(listener: Listener<D>): IDispose {
    this.listeners.push(listener);
    return {
      dispose: () => this.off(listener),
    };
  }
  once(listener: Listener<D>): void {
    this.onceListeners.push(listener);
  }
  off(listener: Listener<D>): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }
  emit(event: D): void {
    if (this._focus && !this._focus.has(event.type)) {
      return;
    }
    this.listeners.forEach((listener) => listener(event));
    this.onceListeners.forEach((listener) => listener(event));
    this.onceListeners = [];
  }
  focus<R>(fn: () => R, ...events: D["type"][]): R {
    let currentFocus: Event<D>["_focus"];
    return new Context(
      () => {
        currentFocus = this._focus;
        this._focus = !currentFocus
          ? new Set(events)
          : new Set(events.filter((event) => currentFocus!.has(event)));
      },
      () => this._focus = currentFocus,
    ).run(fn);
  }
}
