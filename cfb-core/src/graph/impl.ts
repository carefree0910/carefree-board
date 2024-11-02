import type { IGraph, IGraphGroup, IGraphNode, IGraphSingleNode } from "./types.ts";
import type { IGroupR, INodeR, ISingleNodeR } from "../nodes.ts";

import { isUndefined } from "../toolkit.ts";
import { isGroup, isSingleNode } from "../nodes.ts";

export function getGraphNode(node: INodeR): GraphNode {
  if (isGroup(node)) {
    return new GraphGroup(
      node,
      node.children.map((child) => getGraphNode(child)),
    );
  }
  return new GraphSingleNode(node);
}

export class GraphGroup implements IGraphGroup {
  node: IGroupR;
  parent?: GraphGroup;
  children: GraphNode[];

  constructor(node: IGroupR, children: GraphNode[]) {
    this.node = node;
    this.children = children;
  }
}

export class GraphSingleNode<T extends ISingleNodeR = ISingleNodeR>
  implements IGraphSingleNode<T> {
  node: T;
  parent?: GraphGroup;

  constructor(node: T) {
    this.node = node;
  }
}

export type GraphNode = GraphGroup | GraphSingleNode;

export class Graph implements IGraph {
  rootNodes: GraphNode[];
  nodeMapping: Map<string, GraphNode>;

  constructor(rootNodes: GraphNode[]) {
    function _traverse(
      parent: GraphGroup | undefined,
      gnodes: GraphNode[],
    ): void {
      for (const gnode of gnodes) {
        gnode.parent = parent;
        if (nodeMapping.has(gnode.node.alias)) {
          throw new Error(`Alias '${gnode.node.alias}' collides.`);
        }
        nodeMapping.set(gnode.node.alias, gnode);
        if (gnode instanceof GraphGroup) {
          _traverse(gnode, gnode.children);
        }
      }
    }

    this.rootNodes = rootNodes;
    const nodeMapping: Map<string, GraphNode> = new Map();
    _traverse(undefined, rootNodes);
    this.nodeMapping = nodeMapping;
  }
  static fromNodes(nodes: INodeR[]): Graph {
    return new Graph(nodes.map((node) => getGraphNode(node)));
  }

  get allNodes(): IGraphNode[] {
    return Array.from(this.nodeMapping.values());
  }
  get allSingleNodes(): IGraphSingleNode[] {
    const nodes = this.allNodes.filter((node) => isSingleNode(node.node));
    return nodes as IGraphSingleNode[];
  }

  // crud

  add(node: INodeR, parent?: IGroupR): IGraphNode;
  add<T extends ISingleNodeR>(node: T, parent?: IGroupR): IGraphSingleNode<T>;
  add<T extends IGroupR>(node: T, parent?: IGroupR): IGraphGroup<T>;
  add(): IGraphNode {
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
      if (!(parentGnode instanceof GraphGroup)) {
        throw new Error(`Parent node '${parent.alias}' is not a group.`);
      }
      gnode.parent = parentGnode;
      parentGnode.children.push(gnode);
    }
    this.nodeMapping.set(node.alias, gnode);
    return gnode;
  }

  get(alias: string): IGraphNode;
  get<T extends ISingleNodeR>(alias: string): IGraphSingleNode<T>;
  get<T extends IGroupR>(alias: string): IGraphGroup<T>;
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
  tryGet<T extends IGroupR>(alias: string): IGraphGroup<T> | null;
  tryGet(): IGraphNode | null {
    const alias = arguments[0];
    return this.nodeMapping.get(alias) ?? null;
  }

  update(alias: string, node: INodeR): IGraphNode;
  update<T extends ISingleNodeR>(alias: string, node: T): IGraphSingleNode<T>;
  update<T extends IGroupR>(alias: string, node: T): IGraphGroup<T>;
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
  delete<T extends IGroupR>(
    alias: string,
    check?: boolean,
  ): IGraphGroup<T> | undefined;
  delete(): IGraphNode | undefined {
    function _popRecursive(gnode: GraphNode): void {
      nodeMapping.delete(gnode.node.alias);
      if (gnode instanceof GraphGroup) {
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
  tryDelete<T extends IGroupR>(alias: string): IGraphGroup<T> | undefined;
  tryDelete(): IGraphNode | undefined {
    const alias = arguments[0];
    return this.delete(alias, false);
  }
}
