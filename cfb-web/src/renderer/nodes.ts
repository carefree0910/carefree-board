export * from "./nodes/base.ts";
export * from "./nodes/shape.ts";

import { registerRenderNode } from "@carefree0910/cfb-core";
import { WebRectangleRenderNode } from "./nodes/shape.ts";

registerRenderNode("rectangle", WebRectangleRenderNode);
