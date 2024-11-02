import type { ISingleNodeR } from "./types.ts";
import type { Matrix2D } from "../toolkit.ts";

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

export interface IMakeSingleNode<T extends ISingleNodeR> {
  type: T["type"];
  uuid?: string;
  alias: string;
  transform: Matrix2D;
  params: T["params"];
  z: number;
}
export function makeSingleNode<T extends ISingleNodeR>({
  type,
  uuid,
  alias,
  transform,
  params,
  z,
}: IMakeSingleNode<T>): T {
  return NODE_FACTORY.fromJsonData({
    type,
    alias,
    uuid: uuid ?? v4(),
    transform,
    params,
    z,
  });
}
