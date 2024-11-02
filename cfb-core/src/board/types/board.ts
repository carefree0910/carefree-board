import type { IBoardNode } from "./node.ts";
import type { ISingleNodeR } from "../../nodes.ts";
import type { IGraph } from "../../graph.ts";

/**
 * The board, can be treated as the 'container' of the 'world'
 *
 * A 'board' is not that complicated on its own, it's just a collection of board nodes and
 * has some operations to manage them. That's why we call it a 'container'.
 *
 * What makes the whole 'world' 'alive' is something else. To list a few:
 *
 * 1. An event layer, which will allow user interactions.
 * 2. A plugin layer, which can 'inject' some functionalities into the world.
 * 3. A render layer, which is responsible for rendering the 'board'.
 *
 * These layers are implemented at other modules, so the 'board' itself can be kept simple.
 *
 * @param graph The inner data of the world.
 * @property allNodes All nodes in the board.
 * @method add Add a node to the board.
 * @method get Get a node by its alias, throw an error if not found.
 * @method tryGet Get a node by its alias, return undefined if not found.
 * @method update Update an existing node with a new one.
 * @method delete Delete a node by its alias.
 */
export interface IBoard {
  graph: IGraph;

  get allNodes(): IBoardNode[];

  add(node: ISingleNodeR, parent?: string): void;
  get(alias: string): IBoardNode;
  tryGet(alias: string): IBoardNode | undefined;
  update(alias: string, node: ISingleNodeR): void;
  delete(alias: string): void;
}
