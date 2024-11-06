import type { DirtyStatus, IRenderNode } from "./node.ts";
import type { IGraph } from "../../graph.ts";
import type { ISingleNodeR } from "../../nodes.ts";

/**
 * The necessary information to render the graph.
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
 * 1. When the `world` is ready, start the renderer with the `start` method.
 * 2. Refresh the renderer when necessary. Notice that the `refresh` method
 *    should return immediately, which can be achieved by an async-queue-ish mechanism.
 * 3. Wait for the rendering to finish with the `wait` method when needed.
 * > The typical use case of `wait` is when you want to make sure the rendering is
 * > finished before next user interaction happens.
 *
 * See {@link Renderer}, which is a basic implementation of this interface.
 */
export interface IRenderer {
  /**
   * The graph to render.
   */
  graph: IGraph;

  /**
   * All existing nodes in the renderer.
   */
  get allNodes(): IRenderNode[];

  /**
   * Add an `ISingleNodeR` to the renderer.
   *
   * @param node The node to add, it should be a `single` node because only
   * `single` nodes are renderable.
   * @param parent The alias of the parent node, if any.
   */
  add(node: ISingleNodeR, parent?: string): void;
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
   * Update an existing {@link IRenderNode} with a new `ISingleNodeR`.
   *
   * @param alias The alias of the node to update.
   * @param node The new node to update with.
   */
  update(alias: string, node: ISingleNodeR): void;
  /**
   * Delete an {@link IRenderNode} by its alias, throw an error if not found.
   *
   * @param alias The alias of the node to delete.
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
}
