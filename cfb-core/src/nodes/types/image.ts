import type { INodeParamsBase, ISingleNode } from "./base.ts";

export interface IImageParams extends INodeParamsBase {
  src: string;
}

export interface IImageNode extends ISingleNode {
  type: "image";
  params: IImageParams;
}
