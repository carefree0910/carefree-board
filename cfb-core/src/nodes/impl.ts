import type { IGroupR, INodeJsonData, ISingleNodeR } from "./types.ts";

import { v4 } from "uuid";
import { NODE_FACTORY, registerGroupNode, registerSingleNode } from "./impl/base.ts";
import { Group } from "./impl/group.ts";
import { ImageNode } from "./impl/image.ts";
import { RectangleNode } from "./impl/shape/rectangle.ts";

export * from "./impl/base.ts";
export * from "./impl/shape/base.ts";
export * from "./impl/shape/rectangle.ts";
export * from "./impl/image.ts";
export * from "./impl/group.ts";

registerSingleNode("rectangle", RectangleNode);
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
