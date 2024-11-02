import type { DirtyStatus, IBoard } from "../board.ts";

/**
 * The necessary information to render the board.
 *
 * @param dirtyStatuses The dirty statuses of the nodes.
 */
export interface IRenderInfo {
  dirtyStatuses: Map<string, DirtyStatus>;
}
/**
 * The renderer interface.
 *
 * The workflow of rendering is as follows:
 *
 * 1. When the 'world' is ready, start the renderer with the `start` method.
 * 2. Refresh the renderer when necessary. There are two common ways to define 'necessary':
 *
 *    i. Only when user interaction happens.
 *
 *    ii. Periodically, e.g. calling `refresh` at 60fps.
 *
 *    No matter which way you choose, the `refresh` method should return immediately. This
 *    can be achieved by an async-queue-ish mechanism.
 *
 * > i. is more efficient 'theoretically', but ii. is easier to implement and maintain. It's
 * > up to the 'world' to decide which way to go.
 *
 * 3. Wait for the rendering to finish with the `wait` method when needed.
 *
 * > Typical use case is when you want to make sure the rendering is finished before next
 * > user interaction happens.
 *
 * @param board The board to render.
 * @method start Start the renderer.
 * @method refresh Refresh the renderer, this method should return immediately.
 * @method wait Wait for the current rendering to finish.
 */
export interface IRenderer {
  board: IBoard;

  start(): Promise<void>;
  refresh(): void;
  wait(): Promise<void>;
}
