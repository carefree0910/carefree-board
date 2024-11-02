import type { IBoard, IBoardNode } from "../types.ts";
import type { IGroupR, ISingleNodeR } from "../../nodes.ts";
import type { IGraph } from "../../graph.ts";

import { getBoardNode } from "./nodes.ts";
import { isUndefined } from "../../toolkit.ts";

/**
 * A basic implementation of the `IBoard` interface.
 *
 * > Again, it's worth mentioning that the 'board' itself is lightweight, only
 * > serving as a 'container' of the 'world'. The complexity of the 'world' is
 * > handled by other layers.
 *
 * @param graph The inner data of the world.
 * @param bnodes All board nodes in the world.
 * @param nodeMapping A mapping from the node's alias to the node.
 */
export class Board implements IBoard {
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

  get allNodes(): IBoardNode[] {
    return this.bnodes;
  }

  // crud

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

  get(alias: string): IBoardNode {
    const bnode = this.tryGet(alias);
    if (!bnode) {
      throw new Error(`Node with alias ${alias} does not exist`);
    }
    return bnode;
  }
  tryGet(alias: string): IBoardNode | undefined {
    return this.nodeMapping.get(alias);
  }

  update(alias: string, node: ISingleNodeR): void {
    this.delete(alias);
    this.add(node);
  }

  delete(alias: string): void {
    const bnode = this.nodeMapping.get(alias);
    if (!bnode) {
      throw new Error(`Node with alias ${alias} does not exist`);
    }
    this.bnodes = this.bnodes.filter((n) => n !== bnode);
    this.nodeMapping.delete(alias);
  }
}
