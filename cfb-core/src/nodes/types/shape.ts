import type { INodeParamsBase, ISingleNode } from "./base.ts";
import type { Matrix2D, Point } from "../../toolkit.ts";

export interface IVertex {
  p0: Point;
  p1?: Point;
  p2?: Point;
  p3?: Point;

  transformBy(matrix: Matrix2D): IVertex;
}

export interface IShapeNode extends ISingleNode {
  getRawVertices(): IVertex[];
  getVertices(transform: Matrix2D): IVertex[];
}

export interface IRectangleParams extends INodeParamsBase {
  radius?: {
    lt?: number;
    rt?: number;
    rb?: number;
    lb?: number;
  };
}
export interface IRectangleNode extends IShapeNode {
  type: "rectangle";
  params: IRectangleParams;
}
