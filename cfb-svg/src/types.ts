import type { G, Svg } from "npm:@svgdotjs/svg.js@^3.2.0";
import type { ISingleNodeR } from "@carefree0910/cfb-core";

export type SVGGroupPack = { group: G };
export type ExportOptions = Partial<{
  exportBox: { x: number; y: number; w: number; h: number };
}>;

/**
 * The interface for the SVG exporter.
 *
 * @method getSVGGroup Obtain an SVG group of a single node.
 * > For more information on this method, please refer to the documentation of
 * > `SVGExporterBase.getSVGGroup`.
 * @method export Export a list of nodes and combine them into a single SVG.
 */
export interface ISVGExporter {
  getSVGGroup(node: ISingleNodeR, opt?: ExportOptions): Promise<SVGGroupPack>;
  export(nodes: ISingleNodeR[], opt?: ExportOptions): Promise<Svg>;
}
