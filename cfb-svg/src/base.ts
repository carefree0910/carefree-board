import type { Svg } from "npm:@svgdotjs/svg.js@^3.2.0";
import type { IFillParams, ISingleNodeR, IStrokeParams } from "@carefree0910/cfb-core";
import type { ExportOptions, ISVGExporter, SVGGroupPack } from "./types.ts";

import { Defs, Element, G, Mask, Rect, SVG } from "npm:@svgdotjs/svg.js@^3.2.0";
import { BBoxes, Matrix2D } from "@carefree0910/cfb-core";
import { getMaskId, getUniqueSvg } from "./utils.ts";

function getCTMOf(shape: Element): Matrix2D {
  const { a, b, c, d, e, f } = shape.transform();
  return new Matrix2D(a!, b!, c!, d!, e!, f!);
}

export abstract class SVGExporterBase implements ISVGExporter {
  /**
   * Obtain a 'raw' SVG Group (with the upper-left corner at the origin, no transform
   * other than scale, and no fill/stroke parameters).
   *
   * > The reason why scaling is included is that many parameterized graphics depend
   * > on `w` and `h`, and simple scaling cannot render the correct graphics.
   *
   * @param node The node to be exported.
   * @param opt Export options.
   * @returns Exported SVG group.
   */
  abstract getRawSVGGroup(
    node: ISingleNodeR,
    opt?: ExportOptions,
  ): Promise<SVGGroupPack>;

  /**
   * Obtain an 'initial' SVG Group (with the upper-left corner at the origin, and
   * no transform other than scale). The returned group will have fill/stroke handled.
   *
   * Usually downstream modules will prefer to call this method instead of `export`, because
   * this method is more 'atomic' - it focuses on one node, has no 'redundant' transformations,
   * and does not wrap the result with an outer SVG element.
   *
   * > The reason why scaling is included is that many parameterized graphics depend
   * > on `w` and `h`, and simple scaling cannot render the correct graphics.
   *
   * @param node The node to be exported.
   * @param opt Export options.
   * @returns Exported SVG group.
   */
  async getSVGGroup(
    node: ISingleNodeR,
    opt?: ExportOptions,
  ): Promise<SVGGroupPack> {
    const pack = await this.getRawSVGGroup(node, opt);
    const group = pack.group;
    const newElements: Element[] = [];
    for (const p of node.blendedFillParams) {
      this.injectFillParams(group, p, newElements);
    }
    node.strokeParamsList?.forEach((strokeParams) =>
      this.injectStrokeParams(group, strokeParams, newElements)
    );

    let newGroup: G;
    if (newElements.length === 0) {
      newGroup = group;
    } else {
      newGroup = SVG().group();
      const ctm = getCTMOf(group);
      newElements.forEach((path) => newGroup.add(path));
      newGroup.transform(ctm);
    }
    pack.group = newGroup;

    return pack;
  }

  async export(nodes: ISingleNodeR[], opt?: ExportOptions): Promise<Svg> {
    let sketch = SVG();
    const bboxes = new BBoxes([]);
    nodes = nodes.sort((n1, n2) => n2.z - n1.z);
    const tasks = nodes.map((node) => this.getSVGGroup(node, opt));
    const packs = await Promise.all(tasks);
    packs.forEach(({ group }, index) => {
      const node = nodes[index];
      const transform = this.getTransform(node);
      group.transform(transform, true);
      let element: Element = group;
      if (node.maskAlias) {
        const maskGroup = new G();
        maskGroup.add(group);
        maskGroup.attr("mask", `url(#${getMaskId(node.maskAlias)})`);
        element = maskGroup;
      } else if (node.isMask) {
        const maskGroup = new Mask();
        maskGroup.attr("style", "mask-type:alpha");
        maskGroup.add(group);
        element = maskGroup;
      }
      sketch.add(element);
      bboxes.push(node.bbox);
    });
    const bbox = bboxes.bbox;
    const { w, h } = bbox.wh;
    sketch.size(w, h);
    sketch = getUniqueSvg(sketch);
    sketch.children().forEach((child, i) => {
      const node = nodes[i];
      if (node.isMask) {
        child.attr("id", getMaskId(node.alias));
        child.first().attr("id", node.alias);
      } else if (node.maskAlias) {
        child.attr("mask", `url(#${getMaskId(node.maskAlias)})`);
        child.first().attr("id", node.alias);
      } else {
        child.attr("id", node.alias);
      }
    });
    if (opt?.exportBox) {
      const { x, y, w, h } = opt.exportBox;
      sketch.size(w, h);
      sketch.viewbox(x, y, w, h);
    }
    return sketch;
  }

  private getTransform(node: ISingleNodeR): Matrix2D {
    return node.transform.noScale;
  }

  private injectFillParams(
    group: G,
    fillParams: IFillParams,
    newElements: Element[],
  ): void {
    const children = group.children();
    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      if (child instanceof G) {
        return this.injectFillParams(child, fillParams, newElements);
      }
      // handle image stuffs
      let imageFlag = false;
      if (child instanceof Rect) {
        if (i < children.length - 1 && children[i + 1] instanceof Defs) {
          imageFlag = true;
          newElements.push(child.clone());
        }
      }
      if (child instanceof Element) {
        if (fillParams.type === "color") {
          child = child.clone();
          child.fill({
            color: fillParams.color,
            opacity: fillParams.opacity,
          });
        }
        /** @todo : implement other conditions */
      }
      imageFlag
        ? newElements.splice(newElements.length - 2, 0, child)
        : newElements.push(child);
    }
  }

  private injectStrokeParams(
    group: G,
    strokeParams: IStrokeParams,
    newElements: Element[],
  ): void {
    group.children().forEach((child) => {
      if (child instanceof G) {
        return this.injectStrokeParams(child, strokeParams, newElements);
      }
      if (child instanceof Element) {
        /** @todo : clone might cause errors (e.g. filters) */
        child = child.clone();
        child.stroke({
          color: strokeParams.color,
          width: strokeParams.width,
          opacity: strokeParams.opacity,
        });
        child.attr("vector-effect", "non-scaling-stroke");
      }
      newElements.push(child);
    });
  }
}
