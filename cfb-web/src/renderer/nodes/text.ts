import type { ITextNode } from "@carefree0910/cfb-core";
import type { WebRenderer } from "../impl.ts";

import { BBox, Matrix2D } from "@carefree0910/cfb-core";
import { WebRenderNode } from "./base.ts";
import { getAutoFontSize, textToHtml } from "../../utils.ts";

export class WebTextRenderNode extends WebRenderNode<ITextNode> {
  private _span: HTMLSpanElement = document.createElement("span");
  private _spanWrapper: HTMLDivElement = document.createElement("div");

  override initialize(renderer: WebRenderer): Promise<void> {
    this._spanWrapper.style.transformOrigin = "left top";
    this._span.style.width = "100%";
    this._span.style.height = "100%";
    this._span.style.wordBreak = "break-word";
    this._spanWrapper.appendChild(this._span);
    return super.initialize(renderer);
  }

  protected override getNormalizedBBox(): BBox {
    const { x, y, theta, scaleY, skewX, skewY } = this.gnode.node.bbox.decompose();
    // const globalTransform = globalTransform;
    // const globalScale = globalTransform.scaleX;
    // const { x: nx, y: ny } = globalTransform.applyTo(new Coordinate(x, y));
    const nx = x;
    const ny = y;
    const globalScale = 1;
    return new BBox(
      Matrix2D.from({
        x: nx,
        y: ny,
        theta,
        skewX,
        skewY,
        scaleX: globalScale,
        scaleY: globalScale * (scaleY >= 0 ? 1 : -1),
      }),
    );
  }

  override async updateTransform(): Promise<void> {
    const node = this.gnode.node;
    await super.updateTransform();
    if (node.params.autoFitContent) {
      const { w, h } = node.absWH;
      node.params.fontSize = getAutoFontSize({
        w,
        h,
        content: node.params.content,
        maxFontSize: 1024,
      });
    }
    this.updateTransformProperties(node);
  }
  updateContent(renderer: WebRenderer): Promise<void> {
    const node = this.gnode.node;
    this.updateContentProperties(node);
    this.updateTransformProperties(node);
    return this.updateAll(renderer);
  }
  protected injectInnerElement(wrapper: HTMLDivElement, node: ITextNode): Promise<void> {
    this.updateContentProperties(node);
    wrapper.appendChild(this._spanWrapper);
    return Promise.resolve();
  }

  private updateContentProperties(node: ITextNode): void {
    this._span.innerHTML = textToHtml(node.params.content);
    this._span.style.fontSize = `${node.params.fontSize}px`;
    this._span.style.fontFamily = node.params.font ?? "Arial";
    this._span.style.fontWeight = node.params.fontWeight ?? "normal";
    this._span.style.color = node.params.color ?? "black";
    this._span.style.opacity = (node.params.opacity ?? 1).toString();
    this._spanWrapper.style.textAlign = node.params.align ?? "left";
    this._spanWrapper.style.lineHeight = (node.params.lineHeight ?? 1.5).toString();
  }
  private updateTransformProperties(node: ITextNode): void {
    const { w, h } = node.bbox.absWH;
    this._spanWrapper.style.width = `${w}px`;
    this._spanWrapper.style.height = `${h}px`;
  }
}
