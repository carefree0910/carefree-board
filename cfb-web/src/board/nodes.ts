import { registerBoardNode } from "jsr:@carefree0910/cfb-core";
import { WebRectangleBoardNode } from "./nodes/shape.ts";

export * from "./nodes/base.ts";
export * from "./nodes/shape.ts";

registerBoardNode("rectangle", WebRectangleBoardNode);
