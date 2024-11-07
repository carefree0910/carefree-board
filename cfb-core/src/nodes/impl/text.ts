import type { ITextNode, ITextParams } from "../types.ts";
import type { Matrix2D } from "../../toolkit.ts";

import { SingleNodeBase } from "./base.ts";

export class TextNode extends SingleNodeBase implements ITextNode {
  type: "text";
  override params: ITextParams;

  constructor(
    uuid: string,
    alias: string,
    transform: Matrix2D,
    params: ITextParams,
    z: number,
  ) {
    super(uuid, alias, transform, params, z);
    this.type = "text";
    this.params = params;
  }
}
