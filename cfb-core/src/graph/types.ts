import type { IGroupR, INodeR, ISingleNodeR } from "../nodes.ts";

export interface IGraphGroup<T extends IGroupR = IGroupR> {
  node: T;
  parent?: IGraphGroup;
  children: IGraphNode[];
}

export interface IGraphSingleNode<T extends ISingleNodeR = ISingleNodeR> {
  node: T;
  parent?: IGraphGroup;
}

export type IGraphNode = IGraphGroup | IGraphSingleNode;

export interface IGraph {
  rootNodes: IGraphNode[];

  get allNodes(): IGraphNode[];
  get allSingleNodes(): IGraphSingleNode[];

  add(node: INodeR, parent?: IGroupR): IGraphNode;
  add<T extends ISingleNodeR>(node: T, parent?: IGroupR): IGraphSingleNode<T>;
  add<T extends IGroupR>(node: T, parent?: IGroupR): IGraphGroup<T>;
  get(alias: string): IGraphNode;
  get<T extends ISingleNodeR>(alias: string): IGraphSingleNode<T>;
  get<T extends IGroupR>(alias: string): IGraphGroup<T>;
  tryGet(alias: string): IGraphNode | null;
  tryGet<T extends ISingleNodeR>(alias: string): IGraphSingleNode<T> | null;
  tryGet<T extends IGroupR>(alias: string): IGraphGroup<T> | null;
  update(alias: string, node: INodeR): IGraphNode;
  update<T extends ISingleNodeR>(alias: string, node: T): IGraphSingleNode<T>;
  update<T extends IGroupR>(alias: string, node: T): IGraphGroup<T>;
  delete(alias: string, check?: boolean): IGraphNode | undefined;
  delete<T extends ISingleNodeR>(
    alias: string,
    check?: boolean,
  ): IGraphSingleNode<T> | undefined;
  delete<T extends IGroupR>(
    alias: string,
    check?: boolean,
  ): IGraphGroup<T> | undefined;
  tryDelete(alias: string): IGraphNode | undefined;
  tryDelete<T extends ISingleNodeR>(
    alias: string,
  ): IGraphSingleNode<T> | undefined;
  tryDelete<T extends IGroupR>(alias: string): IGraphGroup<T> | undefined;
}
