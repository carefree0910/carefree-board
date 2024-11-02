import type { IShapeNodeR, IVertex, Matrix2D } from "@carefree0910/cfb-core";
import type { ISVGExporter, SVGGroupPack } from "./types.ts";

import { Path, SVG } from "@svgdotjs/svg.js";
import { SVGExporterBase } from "./base.ts";

/**
 * An SVG exporter for `shape` nodes.
 */
export class ShapeNodeSVGExporter extends SVGExporterBase implements ISVGExporter {
  /**
   * Get the 'raw' SVG group of a `shape` node.
   *
   * @param node The `shape` node to export.
   * @returns Exported 'raw' SVG group.
   */
  getRawSVGGroup(node: IShapeNodeR): Promise<SVGGroupPack> {
    const group = SVG().group();
    const path = new Path();
    path.attr("d", this.getPathString(node));
    group.add(path);
    return Promise.resolve({ group });
  }

  /**
   * Get the `<path>` string of a `shape` node.
   *
   * @param node The `shape` node to export.
   * @param reverse Whether to reverse the path.
   * @returns The `<path>` string.
   */
  getPathString(node: IShapeNodeR, reverse: boolean = false): string {
    return this.getPathStringFrom(node.getRawVertices(), reverse);
  }
  /**
   * Get the `<path>` string of a `shape` node, with a given transform to apply.
   *
   * @param node The `shape` node to export.
   * @param transform The transform to apply.
   * @param reverse Whether to reverse the path.
   * @returns The `<path>` string.
   */
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
