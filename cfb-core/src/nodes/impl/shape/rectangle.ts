import type { Matrix2D } from "../../../toolkit.ts";
import type { IRectangleNode, IRectangleParams, IVertex } from "../../types.ts";

import { getVertices, ShapeNodeBase } from "./base.ts";
import { Point } from "../../../toolkit.ts";

export class RectangleNode extends ShapeNodeBase implements IRectangleNode {
  type: "rectangle";
  override params: IRectangleParams;

  constructor(
    uuid: string,
    alias: string,
    transform: Matrix2D,
    params: IRectangleParams,
    z: number,
  ) {
    super(uuid, alias, transform, params, z);
    this.type = "rectangle";
    this.params = params;
  }

  getRawVertices(): IVertex[] {
    const cornerPoints = [
      new Point(0, 0),
      new Point(this.w, 0),
      new Point(this.w, this.h),
      new Point(0, this.h),
    ];
    const radius = [
      this.params.radius?.lt ?? 0,
      this.params.radius?.rt ?? 0,
      this.params.radius?.rb ?? 0,
      this.params.radius?.lb ?? 0,
    ];
    return getVertices(cornerPoints, radius, this.minOfWH);
  }
}
