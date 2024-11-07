import type { IBasicGroup, IImageNode, IRectangleNode, ITextNode } from "../nodes.ts";

export * from "./types/base.ts";
export * from "./types/shape.ts";
export * from "./types/text.ts";
export * from "./types/image.ts";
export * from "./types/group.ts";

/**
 * `R` here means 'realized', which means it represents 'concrete' node types.
 *
 * > When implementing higher-level functions / interfaces, this type should be used instead of `IGroup`.
 */
export type IGroupNodeR = IBasicGroup;
/**
 * `R` here means 'realized', which means it represents 'concrete' node types.
 *
 * > When implementing higher-level functions / interfaces, this type should be used instead of `ISingleNode`.
 */
export type ISingleNodeR = ITextNode | IImageNode | IRectangleNode;
/**
 * `R` here means 'realized', which means it represents 'concrete' node types.
 *
 * > When implementing higher-level functions / interfaces, this type should be used.
 */
export type INodeR = IGroupNodeR | ISingleNodeR;
export type IShapeNodeR = IRectangleNode;

export function isGroupNode(node: INodeR): node is IGroupNodeR {
  return "children" in node;
}
export function isSingleNode(node: INodeR): node is ISingleNodeR {
  return !isGroupNode(node);
}
