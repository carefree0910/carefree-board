export * from "./nodes/base.ts";
export * from "./nodes/shape.ts";
export * from "./nodes/text.ts";

import { registerRenderNode } from "@carefree0910/cfb-core";
import { WebRectangleRenderNode, WebTextRenderNode } from "./impl.ts";

registerRenderNode("rectangle", WebRectangleRenderNode);
registerRenderNode("text", WebTextRenderNode);
