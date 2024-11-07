import type { IGroupR, INodeJsonData, INodeR, ISingleNodeR } from "./types.ts";

import { v4 } from "uuid";
import { NODE_FACTORY, registerGroupNode, registerSingleNode } from "./impl/base.ts";
import { Group } from "./impl/group.ts";
import { TextNode } from "./impl/text.ts";
import { ImageNode } from "./impl/image.ts";
import { RectangleNode } from "./impl/shape/rectangle.ts";

export * from "./impl/base.ts";
export * from "./impl/shape.ts";
export * from "./impl/text.ts";
export * from "./impl/image.ts";
export * from "./impl/group.ts";

registerSingleNode("rectangle", RectangleNode);
registerSingleNode("text", TextNode);
registerSingleNode("image", ImageNode);
registerGroupNode("group", Group);

export interface IMakeSingleNode<T extends ISingleNodeR>
  extends Omit<INodeJsonData<T>, "uuid"> {
  uuid?: string;
}
export function makeSingleNode<T extends ISingleNodeR>(data: IMakeSingleNode<T>): T {
  data.uuid ??= v4();
  return NODE_FACTORY.fromJsonData(data as INodeJsonData<T>);
}

export interface IMakeGroupNode<T extends IGroupR>
  extends Omit<INodeJsonData<T>, "uuid"> {
  uuid?: string;
}
export function makeGroupNode<T extends IGroupR>(data: IMakeGroupNode<T>): T {
  data.uuid ??= v4();
  return NODE_FACTORY.fromJsonData(data as INodeJsonData<T>);
}

export type IMakeNode<T extends INodeR> = T extends ISingleNodeR ? IMakeSingleNode<T>
  : T extends IGroupR ? IMakeGroupNode<T>
  : never;
export function makeNode<T extends INodeR>(data: IMakeNode<T>): T {
  return NODE_FACTORY.fromJsonData(data as INodeJsonData<T>);
}
