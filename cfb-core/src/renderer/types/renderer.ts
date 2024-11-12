import type { IRenderNode } from "./node.ts";
import type {
  JsonSerializable,
  Matrix2D,
  Matrix2DFields,
  Point,
} from "../../toolkit.ts";
import type { IGraph, IGraphJsonData } from "../../graph.ts";

export interface IRendererJsonData {
  graph: IGraphJsonData;
  globalTransform: Matrix2DFields;
}

/**
 * The renderer interface.
 *
 * The workflow of rendering is as follows:
 *
 * 1. When the `world` is ready, start the renderer with the `start` method.
 * 2. Refresh the renderer when necessary. Notice that the `refresh` method
 *    should return immediately, which can be achieved by an async-queue-ish mechanism.
 * 3. Wait for the rendering to finish with the `wait` method when needed.
 * > The typical use case of `wait` is when you want to make sure the rendering is
 * > finished before next user interaction happens.
 *
 * See {@link Renderer}, which is a basic implementation of this interface.
 */
export interface IRenderer extends JsonSerializable<IRendererJsonData> {
  /**
   * The graph to render.
   */
  graph: IGraph;
  /**
   * The global transform matrix of the renderer.
   */
  globalTransform: Matrix2D;

  /**
   * All existing nodes in the renderer.
   */
  get allNodes(): IRenderNode[];

  /**
   * Add an existing `ISingleNodeR` in `graph` to the renderer.
   */
  add(alias: string): void;
  /**
   * Get an {@link IRenderNode} by its alias, throw an error if not found.
   *
   * @param alias The alias of the node to get.
   */
  get(alias: string): IRenderNode;
  /**
   * Try to get an `IRenderNode` by its alias, return `undefined` if not found.
   *
   * @param alias The alias of the node to get.
   */
  tryGet(alias: string): IRenderNode | undefined;
  /**
   * Delete an {@link IRenderNode} by its alias, throw an error if not found.
   *
   * > Notice that this will **NOT** remove the node from the `graph`.
   */
  delete(alias: string): void;

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

  /**
   * Move the renderer 'globally' by a delta.
   */
  globalMove(delta: Point): void;
  /**
   * Set the renderer 'globally' by a scale and a center point.
   */
  globalScale(scale: number, center: Point): void;
  /**
   * Set the renderer's global transform matrix directly.
   */
  setGlobalTransform(matrix: Matrix2D): void;
  /**
   * Set the renderer's global transform matrix directly, without triggering a refresh.
   */
  setGlobalTransformData(transform: Matrix2D): void;
}
