import type { IBoard, IBoardNode } from "../types.ts";
import type { IGroupR, ISingleNodeR } from "../../nodes.ts";
import type { IGraph } from "../../graph.ts";

import { getBoardNode } from "./nodes.ts";
import { isUndefined } from "../../toolkit.ts";

/**
 * A basic implementation of the {@link IBoard} interface.
 *
 * > Again, it's worth mentioning that the `board` itself is lightweight, only
 * > serving as a 'container' of the `world`. The complexity of the `world` is
 * > handled by other layers.
 */
export class Board implements IBoard {
  /**
   * The inner data of the world.
   */
  graph: IGraph;
  private bnodes: IBoardNode[];
  private nodeMapping: Map<string, IBoardNode>;

  constructor(graph: IGraph) {
    this.graph = graph;
    this.bnodes = [];
    this.nodeMapping = new Map();
    for (const node of graph.allSingleNodes) {
      const bnode = getBoardNode(node);
      this.bnodes.push(bnode);
      this.nodeMapping.set(node.node.alias, bnode);
    }
  }

  /**
   * All nodes in the board.
   */
  get allNodes(): IBoardNode[] {
    return this.bnodes;
  }

  // crud

  /**
   * Add an `ISingleNodeR` to the board.
   *
   * @param node The node to add, it should be a `single` node because only
   * `single` nodes are renderable.
   * @param parent The alias of the parent node, if any.
   */
  add(node: ISingleNodeR, parent?: string): void {
    if (this.nodeMapping.has(node.alias)) {
      throw new Error(`Node with alias ${node.alias} already exists`);
    }
    const parentNode = isUndefined(parent)
      ? undefined
      : this.graph.tryGet<IGroupR>(parent)?.node;
    if (!isUndefined(parent) && !parentNode) {
      throw new Error(`Parent with alias ${parent} does not exist`);
    }
    const gnode = this.graph.add<ISingleNodeR>(node, parentNode);
    const bnode = getBoardNode(gnode);
    this.bnodes.push(bnode);
    this.nodeMapping.set(gnode.node.alias, bnode);
  }

  /**
   * Get an {@link IBoardNode} by its alias, throw an error if not found.
   *
   * @param alias The alias of the node to get.
   */
  get(alias: string): IBoardNode {
    const bnode = this.tryGet(alias);
    if (!bnode) {
      throw new Error(`Node with alias ${alias} does not exist`);
    }
    return bnode;
  }
  /**
   * Try to get an `IBoardNode` by its alias, return `undefined` if not found.
   *
   * @param alias The alias of the node to get.
   */
  tryGet(alias: string): IBoardNode | undefined {
    return this.nodeMapping.get(alias);
  }

  /**
   * Update an existing {@link IBoardNode} with a new `ISingleNodeR`.
   *
   * @param alias The alias of the node to update.
   * @param node The new node to update with.
   */
  update(alias: string, node: ISingleNodeR): void {
    this.delete(alias);
    this.add(node);
  }

  /**
   * Delete an {@link IBoardNode} by its alias, throw an error if not found.
   *
   * @param alias The alias of the node to delete.
   */
  delete(alias: string): void {
    const bnode = this.nodeMapping.get(alias);
    if (!bnode) {
      throw new Error(`Node with alias ${alias} does not exist`);
    }
    this.bnodes = this.bnodes.filter((n) => n !== bnode);
    this.nodeMapping.delete(alias);
  }
}
