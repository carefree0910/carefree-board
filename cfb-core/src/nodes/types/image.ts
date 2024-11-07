import type { ISingleNode } from "./base.ts";
import type { IRectangleParams } from "./shape.ts";

export interface IImageParams extends IRectangleParams {
  url: string;
}

export interface IImageNode extends ISingleNode {
  type: "image";
  params: IImageParams;
}
