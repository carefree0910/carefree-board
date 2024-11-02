import type { IGroupNode, INodeParams, INodeR } from "../types.ts";
import type { Matrix2D } from "../../toolkit.ts";

import { GroupBase } from "./base.ts";

export class Group extends GroupBase implements IGroupNode {
  type: "group";

  constructor(
    uuid: string,
    alias: string,
    transform: Matrix2D,
    params: INodeParams,
    z: number,
    children: INodeR[],
  ) {
    super(uuid, alias, transform, params, z, children);
    this.type = "group";
  }
}
