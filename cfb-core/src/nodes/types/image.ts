import type { INodeParams, ISingleNode } from "./base.ts";

export interface IImageParams extends INodeParams {
  src: string;
}

export interface IImageNode extends ISingleNode {
  type: "image";
  params: IImageParams;
}
