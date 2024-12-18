import type {
  IGraph,
  IGraphGroupNode,
  IGraphJsonData,
  IGraphNode,
  IGraphSingleNode,
} from "./types.ts";
import type { IGroupNodeR, INodeR, ISingleNodeR } from "../nodes.ts";

import {
  isUndefined,
  JsonSerializableBase,
  JsonSerializableFactoryBase,
} from "../toolkit.ts";
import { isGroupNode, isSingleNode, NODE_FACTORY } from "../nodes.ts";

/**
 * Construct a `GraphNode` from an `INodeR`.
 */
export function getGraphNode(node: INodeR): GraphNode {
  if (isGroupNode(node)) {
    return new GraphGroupNode(
      node,
      node.children.map((child) => getGraphNode(child)),
    );
  }
  return new GraphSingleNode(node);
}

/**
 * Construct a `GraphGroupNode`.
 *
 * It is recommended to use {@link getGraphNode} instead of the constructor.
 */
export class GraphGroupNode implements IGraphGroupNode {
  node: IGroupNodeR;
  parent?: GraphGroupNode;
  children: GraphNode[];

  constructor(node: IGroupNodeR, children: GraphNode[]) {
    this.node = node;
    this.children = children;
  }
}

/**
 * Construct a `GraphSingleNode`.
 *
 * It is recommended to use {@link getGraphNode} instead of the constructor.
 */
export class GraphSingleNode<T extends ISingleNodeR = ISingleNodeR>
  implements IGraphSingleNode<T> {
  node: T;
  parent?: GraphGroupNode;

  constructor(node: T) {
    this.node = node;
  }
}

/**
 * The union type used to represent a node in the graph.
 */
export type GraphNode = GraphGroupNode | GraphSingleNode;

class GraphFactory extends JsonSerializableFactoryBase<IGraphJsonData, IGraph> {
  fromJsonData(data: IGraphJsonData): IGraph {
    const rootNodes = data.rootNodes.map((nodeData) =>
      NODE_FACTORY.fromJsonData(nodeData)
    );
    return Graph.fromNodes(rootNodes);
  }
}
export const GRAPH_FACTORY: GraphFactory = new GraphFactory();

/**
 * A basic implementation of `IGraph`.
 */
export class Graph extends JsonSerializableBase<IGraphJsonData, GraphFactory>
  implements IGraph {
  rootNodes: GraphNode[];
  nodeMapping: Map<string, GraphNode>;

  constructor(rootNodes: GraphNode[]) {
    function _traverse(
      parent: GraphGroupNode | undefined,
      gnodes: GraphNode[],
    ): void {
      for (const gnode of gnodes) {
        gnode.parent = parent;
        if (nodeMapping.has(gnode.node.alias)) {
          throw new Error(`Alias '${gnode.node.alias}' collides.`);
        }
        nodeMapping.set(gnode.node.alias, gnode);
        if (gnode instanceof GraphGroupNode) {
          _traverse(gnode, gnode.children);
        }
      }
    }

    super();
    this.rootNodes = rootNodes;
    const nodeMapping: Map<string, GraphNode> = new Map();
    _traverse(undefined, rootNodes);
    this.nodeMapping = nodeMapping;
  }
  static fromNodes(nodes: INodeR[]): Graph {
    return new Graph(nodes.map((node) => getGraphNode(node)));
  }

  get factory(): GraphFactory {
    return GRAPH_FACTORY;
  }
  get allNodes(): IGraphNode[] {
    return Array.from(this.nodeMapping.values());
  }
  get allSingleNodes(): IGraphSingleNode[] {
    const nodes = this.allNodes.filter((node) => isSingleNode(node.node));
    return nodes as IGraphSingleNode[];
  }

  // crud

  add(node: INodeR, parent?: IGroupNodeR): IGraphNode;
  add<T extends ISingleNodeR>(node: T, parent?: IGroupNodeR): IGraphSingleNode<T>;
  add<T extends IGroupNodeR>(node: T, parent?: IGroupNodeR): IGraphGroupNode<T>;
  add(): IGraphNode {
    function _traverse(gnode: GraphNode): void {
      nodeMapping.set(gnode.node.alias, gnode);
      if (gnode instanceof GraphGroupNode) {
        for (const child of gnode.children) {
          _traverse(child);
        }
      }
    }

    const node = arguments[0];
    const parent = arguments.length > 1 ? arguments[1] : undefined;
    if (this.nodeMapping.has(node.alias)) {
      throw new Error(`Node with alias '${node.alias}' already exists.`);
    }
    const gnode = getGraphNode(node);
    if (isUndefined(parent)) {
      this.rootNodes.push(gnode);
    } else {
      const parentGnode = this.nodeMapping.get(parent.alias);
      if (!parentGnode) {
        throw new Error(`Parent node '${parent.alias}' does not exist.`);
      }
      if (!(parentGnode instanceof GraphGroupNode)) {
        throw new Error(`Parent node '${parent.alias}' is not a group.`);
      }
      gnode.parent = parentGnode;
      parentGnode.children.push(gnode);
    }
    const nodeMapping = this.nodeMapping;
    _traverse(gnode);
    return gnode;
  }

  get(alias: string): IGraphNode;
  get<T extends ISingleNodeR>(alias: string): IGraphSingleNode<T>;
  get<T extends IGroupNodeR>(alias: string): IGraphGroupNode<T>;
  get(): IGraphNode {
    const alias = arguments[0];
    const gnode = this.tryGet(alias);
    if (!gnode) {
      throw new Error(`Node with alias '${alias}' does not exist.`);
    }
    return gnode;
  }
  tryGet(alias: string): IGraphNode | null;
  tryGet<T extends ISingleNodeR>(alias: string): IGraphSingleNode<T> | null;
  tryGet<T extends IGroupNodeR>(alias: string): IGraphGroupNode<T> | null;
  tryGet(): IGraphNode | null {
    const alias = arguments[0];
    return this.nodeMapping.get(alias) ?? null;
  }

  update(alias: string, node: INodeR): IGraphNode;
  update<T extends ISingleNodeR>(alias: string, node: T): IGraphSingleNode<T>;
  update<T extends IGroupNodeR>(alias: string, node: T): IGraphGroupNode<T>;
  update(): IGraphNode {
    const alias = arguments[0];
    const node = arguments[1];
    const original_gnode = this.get(alias);
    if (!original_gnode) {
      throw new Error(`Node with alias '${alias}' does not exist.`);
    }
    this.delete(alias, false);
    return this.add(node, original_gnode.parent?.node);
  }

  delete(alias: string, check?: boolean): IGraphNode | undefined;
  delete<T extends ISingleNodeR>(
    alias: string,
    check?: boolean,
  ): IGraphSingleNode<T> | undefined;
  delete<T extends IGroupNodeR>(
    alias: string,
    check?: boolean,
  ): IGraphGroupNode<T> | undefined;
  delete(): IGraphNode | undefined {
    function _popRecursive(gnode: GraphNode): void {
      nodeMapping.delete(gnode.node.alias);
      if (gnode instanceof GraphGroupNode) {
        for (const child of gnode.children) {
          _popRecursive(child);
        }
      }
    }

    const alias = arguments[0];
    const check = arguments.length > 1 ? arguments[1] : true;
    const nodeMapping = this.nodeMapping;
    const gnode = nodeMapping.get(alias);
    if (!gnode) {
      if (check) {
        throw new Error(`Node with alias '${alias}' does not exist.`);
      }
      return undefined;
    }
    const gnodeParent = gnode.parent;
    if (isUndefined(gnodeParent)) {
      this.rootNodes = this.rootNodes.filter((n) => n !== gnode);
    } else {
      gnodeParent.children = gnodeParent.children.filter((n) => n !== gnode);
    }
    _popRecursive(gnode);
    return gnode;
  }
  tryDelete(alias: string): IGraphNode | undefined;
  tryDelete<T extends ISingleNodeR>(
    alias: string,
  ): IGraphSingleNode<T> | undefined;
  tryDelete<T extends IGroupNodeR>(alias: string): IGraphGroupNode<T> | undefined;
  tryDelete(): IGraphNode | undefined {
    const alias = arguments[0];
    return this.delete(alias, false);
  }

  toJsonData(): IGraphJsonData {
    return {
      rootNodes: this.rootNodes.map((gnode) => gnode.node.toJsonData()),
    };
  }
}
