import type { IBasicGroup, INodeParamsBase, INodeR } from "../types.ts";
import type { Matrix2D } from "../../toolkit.ts";

import { GroupNodeBase } from "./base.ts";

export class BasicGroup extends GroupNodeBase implements IBasicGroup {
  type: "group";

  constructor(
    uuid: string,
    alias: string,
    transform: Matrix2D,
    params: INodeParamsBase,
    z: number,
    children: INodeR[],
  ) {
    super(uuid, alias, transform, params, z, children);
    this.type = "group";
  }
}
