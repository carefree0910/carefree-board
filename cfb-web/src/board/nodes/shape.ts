import type { IRectangleNode, IShapeNodeR } from "@carefree0910/cfb-core";
import type { WebRenderer } from "../../renderer.ts";

import { SVG } from "npm:@svgdotjs/svg.js@^3.2.0";
import { isUndefined } from "@carefree0910/cfb-core";
import { getUniqueSvg, ShapeNodeSVGExporter } from "@carefree0910/cfb-svg";
import { WebBoardNode } from "./base.ts";

class WebShapeBoardNode<T extends IShapeNodeR> extends WebBoardNode<T> {
  updateContent(renderer: WebRenderer): Promise<void> {
    const pathElement = this.element.children[0]?.children[0]?.children[0]
      ?.children[0];
    if (isUndefined(pathElement)) {
      throw new Error("Path element is not found");
    }
    const node = this.gnode.node;
    const pathString = new ShapeNodeSVGExporter().getPathString(node);
    pathElement.setAttribute("d", pathString);
    const rgba = node.blendedFillColor;
    if (rgba) {
      pathElement.setAttribute("fill", rgba.rgbString);
      pathElement.setAttribute("fill-opacity", rgba.a.toString());
    }
    return this.updateAll(renderer);
  }
  protected async injectInnerElement(
    wrapper: HTMLDivElement,
    node: T,
  ): Promise<void> {
    const pack = await new ShapeNodeSVGExporter().getSVGGroup(node);
    const svg = SVG();
    svg.attr("overflow", "visible");
    svg.add(getUniqueSvg(pack.group));
    wrapper.innerHTML = svg.svg();
  }
}

export class WebRectangleBoardNode extends WebShapeBoardNode<IRectangleNode> {}
