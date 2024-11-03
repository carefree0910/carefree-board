import type { IRenderer } from "../renderer.ts";
import type { IEventSystem } from "../event.ts";

/**
 * World interface.
 *
 * A 'world' is the highest level of abstraction in the whole system. It should be responsible
 * to handle other layers (e.g., renderer, events, plugins, ...) and combine them together.
 *
 * Downstream 'concrete' applications should only interact with the 'world'.
 *
 * @template R Type of the renderer layer.
 * @template E Type of the event system layer.
 *
 * @method start Start the 'world'. This method should activate all binding layers.
 * > We found that in practice, the activation order of layers is important, and is suggested
 * > to keep consistent. Here's a common order:
 * >
 * > 1. Renderer.
 * > 2. Event system.
 * >
 * > This list can be extended in the future, and concrete implementations should be updated accordingly.
 */
export interface IWorld<
  R extends IRenderer = IRenderer,
  E extends IEventSystem = IEventSystem,
> {
  renderer: R;
  eventSystem: E;

  start(): void;
}
