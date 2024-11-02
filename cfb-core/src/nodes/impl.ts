import { registerGroupNode, registerSingleNode } from "./impl/base.ts";
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
