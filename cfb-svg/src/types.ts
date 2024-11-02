import type { G, Svg } from "@svgdotjs/svg.js";
import type { ISingleNodeR } from "@carefree0910/cfb-core";

/**
 * The 'group pack' that an exporter should return in the `getSVGGroup` method.
 *
 * @param group The SVG group that represents the node.
 */
export interface SVGGroupPack {
  group: G;
}
/**
 * The options for exporting SVG.
 *
 * @param exportBox The box to be exported. If not provided, the exporter will use the
 * bounding box of the node as the export box.
 */
export interface ExportOptions {
  exportBox?: { x: number; y: number; w: number; h: number };
}

/**
 * The interface for the SVG exporter.
 *
 * @method getSVGGroup Obtain an SVG group of a single node.
 * > For more information on this method, please refer to the documentation of
 * > `SVGExporterBase.getSVGGroup`.
 * @method export Export a list of nodes and combine them into a single SVG.
 */
export interface ISVGExporter {
  getSVGGroup(node: ISingleNodeR, option?: ExportOptions): Promise<SVGGroupPack>;
  export(nodes: ISingleNodeR[], option?: ExportOptions): Promise<Svg>;
}
