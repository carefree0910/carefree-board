import type { IBoardNode } from "./node.ts";
import type { ISingleNodeR } from "../../nodes.ts";
import type { IGraph } from "../../graph.ts";

/**
 * The board. It can be treated as the 'container' of the `world`.
 *
 * A `board` is not that complicated on its own, it's just a collection of board nodes and
 * has some operations to manage them. That's why we call it a 'container'.
 *
 * What makes the whole `world` 'alive' is something else. To list a few:
 *
 * 1. An event layer, which will allow user interactions.
 * 2. A plugin layer, which can 'inject' some functionalities into the world.
 * 3. A render layer, which is responsible for rendering the `board`.
 *
 * These layers are implemented at other modules, so the `board` itself can be kept simple.
 *
 * > See {@link Board}, which is a basic implementation of this interface.
 */
export interface IBoard {
  /**
   * The inner data of the `world`.
   */
  graph: IGraph;

  /**
   * All existing nodes in the board.
   */
  get allNodes(): IBoardNode[];

  /**
   * Add an `ISingleNodeR` to the board.
   *
   * @param node The node to add, it should be a `single` node because only
   * `single` nodes are renderable.
   * @param parent The alias of the parent node, if any.
   */
  add(node: ISingleNodeR, parent?: string): void;
  /**
   * Get an {@link IBoardNode} by its alias, throw an error if not found.
   *
   * @param alias The alias of the node to get.
   */
  get(alias: string): IBoardNode;
  /**
   * Try to get an `IBoardNode` by its alias, return `undefined` if not found.
   *
   * @param alias The alias of the node to get.
   */
  tryGet(alias: string): IBoardNode | undefined;
  /**
   * Update an existing {@link IBoardNode} with a new `ISingleNodeR`.
   *
   * @param alias The alias of the node to update.
   * @param node The new node to update with.
   */
  update(alias: string, node: ISingleNodeR): void;
  /**
   * Delete an {@link IBoardNode} by its alias, throw an error if not found.
   *
   * @param alias The alias of the node to delete.
   */
  delete(alias: string): void;
}
