import type { IShapeNodeR, IVertex, Matrix2D } from "@carefree0910/cfb-core";
import type { ISVGExporter, SVGGroupPack } from "./types.ts";

import { Path, SVG } from "npm:@svgdotjs/svg.js@^3.2.0";
import { SVGExporterBase } from "./base.ts";

export class ShapeNodeSVGExporter extends SVGExporterBase implements ISVGExporter {
  getRawSVGGroup(node: IShapeNodeR): Promise<SVGGroupPack> {
    const group = SVG().group();
    const path = new Path();
    path.attr("d", this.getPathString(node));
    group.add(path);
    return Promise.resolve({ group });
  }

  getPathString(node: IShapeNodeR, reverse: boolean = false): string {
    return this.getPathStringFrom(node.getRawVertices(), reverse);
  }
  getPathStringWith(
    node: IShapeNodeR,
    transform: Matrix2D,
    reverse: boolean = false,
  ): string {
    return this.getPathStringFrom(node.getVertices(transform), reverse);
  }

  private getPathStringFrom(
    vertices: IVertex[],
    reverse: boolean = false,
  ): string {
    const counts = vertices.length;
    return vertices.reduce((memo, points, idx) => {
      let p0, p1, p2, p3;
      if (!reverse) {
        ({ p0, p1, p2, p3 } = points);
      } else {
        if (idx !== 0) {
          points = vertices[counts - idx];
        }
        if (!points.p1 || !points.p2 || !points.p3) {
          ({ p0, p1, p2, p3 } = points);
        } else {
          p0 = points.p3;
          p1 = points.p2;
          p2 = points.p1;
          p3 = points.p0;
        }
      }
      return (
        memo +
        `${idx === 0 ? "M" : "L"} ${p0.toSVGString()}` +
        (p1 && p2 && p3
          ? `C${p1.toSVGString()} ${p2.toSVGString()} ${p3.toSVGString()}`
          : "") +
        `${idx === counts - 1 ? "Z" : ""}`
      );
    }, "");
  }
}
