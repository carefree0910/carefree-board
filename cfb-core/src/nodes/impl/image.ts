import type { IImageNode, IImageParams } from "../types.ts";
import type { Matrix2D } from "../../toolkit.ts";

import { SingleNodeBase } from "./base.ts";

export class ImageNode extends SingleNodeBase implements IImageNode {
  type: "image";
  override params: IImageParams;

  constructor(
    uuid: string,
    alias: string,
    transform: Matrix2D,
    params: IImageParams,
    z: number,
  ) {
    super(uuid, alias, transform, params, z);
    this.type = "image";
    this.params = params;
  }
}
