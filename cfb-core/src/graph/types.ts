import type { IGroupNodeR, INodeR, ISingleNodeR } from "../nodes.ts";

/**
 * The interface for a group node in the graph.
 */
export interface IGraphGroupNode<T extends IGroupNodeR = IGroupNodeR> {
  node: T;
  parent?: IGraphGroupNode;
  children: IGraphNode[];
}

/**
 * The interface for a single node in the graph.
 */
export interface IGraphSingleNode<T extends ISingleNodeR = ISingleNodeR> {
  node: T;
  parent?: IGraphGroupNode;
}

/**
 * The union type used to represent a node in the graph.
 */
export type IGraphNode = IGraphGroupNode | IGraphSingleNode;

/**
 * The interface for a graph.
 *
 * The `graph` structure mainly maintains the `parent` of each {@link INodeR}, which is
 * not represented in the original {@link INodeR} interface (to avoid circular references).
 */
export interface IGraph {
  rootNodes: IGraphNode[];

  get allNodes(): IGraphNode[];
  get allSingleNodes(): IGraphSingleNode[];

  add(node: INodeR, parent?: IGroupNodeR): IGraphNode;
  add<T extends ISingleNodeR>(node: T, parent?: IGroupNodeR): IGraphSingleNode<T>;
  add<T extends IGroupNodeR>(node: T, parent?: IGroupNodeR): IGraphGroupNode<T>;
  get(alias: string): IGraphNode;
  get<T extends ISingleNodeR>(alias: string): IGraphSingleNode<T>;
  get<T extends IGroupNodeR>(alias: string): IGraphGroupNode<T>;
  tryGet(alias: string): IGraphNode | null;
  tryGet<T extends ISingleNodeR>(alias: string): IGraphSingleNode<T> | null;
  tryGet<T extends IGroupNodeR>(alias: string): IGraphGroupNode<T> | null;
  update(alias: string, node: INodeR): IGraphNode;
  update<T extends ISingleNodeR>(alias: string, node: T): IGraphSingleNode<T>;
  update<T extends IGroupNodeR>(alias: string, node: T): IGraphGroupNode<T>;
  delete(alias: string, check?: boolean): IGraphNode | undefined;
  delete<T extends ISingleNodeR>(
    alias: string,
    check?: boolean,
  ): IGraphSingleNode<T> | undefined;
  delete<T extends IGroupNodeR>(
    alias: string,
    check?: boolean,
  ): IGraphGroupNode<T> | undefined;
  tryDelete(alias: string): IGraphNode | undefined;
  tryDelete<T extends ISingleNodeR>(
    alias: string,
  ): IGraphSingleNode<T> | undefined;
  tryDelete<T extends IGroupNodeR>(alias: string): IGraphGroupNode<T> | undefined;
}
