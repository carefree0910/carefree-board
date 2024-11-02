import type { IShapeNodeR, ISingleNodeR } from "@carefree0910/cfb-core";
import type { WebRenderer } from "../../renderer.ts";

import { BBox, BoardNodeBase, isUndefined, Matrix2D } from "@carefree0910/cfb-core";

export function applyTransformTo(
  element: HTMLDivElement | SVGElement,
  transform: Matrix2D,
): void {
  const { a, b, c, d, e, f } = transform.fields;
  const transformString = `matrix(${a},${b},${c},${d},${e},${f})`;
  if (element instanceof HTMLDivElement) {
    element.style.transform = transformString;
  } else {
    element.setAttribute("transform", transformString);
  }
}

export abstract class WebBoardNode<
  T extends IShapeNodeR,
> extends BoardNodeBase<T> {
  isEntity = true;
  originalW: number = 0;
  originalH: number = 0;
  divTransform: Matrix2D = Matrix2D.identity();

  protected _element?: HTMLDivElement;

  protected abstract injectInnerElement(
    wrapper: HTMLDivElement,
    node: ISingleNodeR,
  ): Promise<void>;

  get element(): HTMLDivElement {
    if (isUndefined(this._element)) {
      throw new Error("`_element` is not initialized yet");
    }
    return this._element;
  }
  get normalizedWH(): { w: number; h: number } {
    return this.getNormalizedWH();
  }
  get normalizedBBox(): BBox {
    return this.getNormalizedBBox();
  }

  getLayer(renderer: WebRenderer): HTMLDivElement {
    return this.isEntity ? renderer.nodesLayer! : renderer.uiLayer!;
  }
  async initialize(renderer: WebRenderer): Promise<void> {
    this._element = await this.generateElement();
    this._element.id = this.alias;
    this.getLayer(renderer).appendChild(this._element);
    return this.updateAll(renderer);
  }
  updateTransform(): Promise<void> {
    const { w, h } = this.normalizedWH;
    this.element.style.width = `${w}px`;
    this.element.style.height = `${Math.abs(h)}px`;
    const divTransform = this.normalizedBBox.transform;
    applyTransformTo(this.element, divTransform);
    return this.handleMask();
  }
  async reRender(renderer: WebRenderer): Promise<void> {
    const element = await this.generateElement();
    element.id = this.element.id;
    this.getLayer(renderer).replaceChild(element, this.element);
    this._element = element;
    return this.updateAll(renderer);
  }

  protected async generateElement(): Promise<HTMLDivElement> {
    const node = this.gnode.node.snapshot();
    const { w, h } = node.absWH;
    node.bbox = BBox.from(w, h);
    const wrapper = document.createElement("div");
    wrapper.style.overflow = "visible";
    wrapper.style.position = "absolute";
    wrapper.style.transformOrigin = "left top";
    await this.injectInnerElement(wrapper, node);
    return wrapper;
  }
  protected updateAll(renderer: WebRenderer): Promise<void> {
    this.updateLayer(renderer);
    this.updateElementInfo();
    return this.updateTransform();
  }
  protected updateLayer(renderer: WebRenderer): void {
    const graph = renderer.board.graph;
    const maxZIndex = Math.max(
      ...graph.allSingleNodes.map((gnode) => gnode.node.z),
    );
    const zIndex = maxZIndex - this.gnode.node.z + 1;
    this.element.style.zIndex = Math.round(zIndex * 100.0).toString();
  }
  protected getDivTransform(element: HTMLDivElement): Matrix2D {
    const transformString = element.getAttribute("transform");
    if (!transformString) {
      return Matrix2D.identity();
    }
    const { a, b, c, d, e, f } = new DOMMatrix(transformString);
    return new Matrix2D(a, b, c, d, e, f);
  }
  protected updateElementInfo(): void {
    const { w, h } = this.gnode.node.wh;
    this.originalW = w;
    this.originalH = h;
    this.divTransform = this.getDivTransform(this.element);
  }
  protected getNormalizedWH(): { w: number; h: number } {
    const { w, h } = this.gnode.node.wh;
    const { w: nw, h: nh } = this.normalizedBBox;
    // const globalScale = globalTransform.scaleX;
    const globalScale = 1;
    return {
      w: (w * globalScale) / nw,
      h: Math.abs((h * globalScale) / nh) * Math.sign(h),
    };
  }
  protected getNormalizedBBox(): BBox {
    // const globalTransform = globalTransform;
    const globalTransform = Matrix2D.identity();
    return new BBox(
      this.divTransform.transformBy(
        this.gnode.node.transform
          .scale(1.0 / this.originalW, 1.0 / Math.abs(this.originalH))
          .transformBy(globalTransform),
      ),
    );
  }

  private async handleMask(): Promise<void> {
    /** @todo : implement this */
  }
}
