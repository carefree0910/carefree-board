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
 * 2. Refresh the renderer when necessary. Notice that the `refresh` method
 *    should return immediately, which can be achieved by an async-queue-ish mechanism. *
 * 3. Wait for the rendering to finish with the `wait` method when needed.
 * > Typical use case is when you want to make sure the rendering is finished before next
 * > user interaction happens.
 */
export interface IRenderer {
  /**
   * The board to render.
   */
  board: IBoard;

  /**
   * Initialize the renderer.
   */
  start(): Promise<void>;
  /**
   * Refresh the renderer, this method should return immediately.
   */
  refresh(): void;
  /**
   * Wait for the current rendering to finish.
   */
  wait(): Promise<void>;
}
