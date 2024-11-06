export * from "./renderer/nodes.ts";

import type { IGraph } from "@carefree0910/cfb-core";

import { Renderer } from "@carefree0910/cfb-core";

export class WebRenderer extends Renderer {
  container: HTMLDivElement;
  renderLayer: HTMLDivElement;
  nodesLayer: HTMLDivElement;
  uiLayer: HTMLDivElement;

  constructor(graph: IGraph) {
    super(graph);
    this.container = document.getElementById("container")! as HTMLDivElement;
    // render layer
    const renderLayer = document.createElement("div");
    renderLayer.setAttribute("id", "renderLayer");
    renderLayer.style.userSelect = "none";
    renderLayer.style.overflow = "hidden";
    // main layer
    const mainLayer = document.createElement("div");
    mainLayer.setAttribute("id", "mainLayer");
    mainLayer.setAttribute("pointer-events", "none");
    renderLayer.appendChild(mainLayer);
    // nodes layer
    const nodesLayer = document.createElement("div");
    nodesLayer.setAttribute("id", "nodesLayer");
    nodesLayer.setAttribute("pointer-events", "none");
    mainLayer.appendChild(nodesLayer);
    // ui layer
    const uiLayer = document.createElement("div");
    uiLayer.setAttribute("id", "uiLayer");
    uiLayer.setAttribute("pointer-events", "none");
    renderLayer.appendChild(uiLayer);
    // attributes
    const setCommonAttributes = (div: HTMLDivElement, position: string) => {
      div.style.width = "100%";
      div.style.height = "100%";
      div.style.pointerEvents = "none";
      div.style.position = position;
    };
    setCommonAttributes(renderLayer, "relative");
    setCommonAttributes(nodesLayer, "relative");
    setCommonAttributes(mainLayer, "absolute");
    setCommonAttributes(uiLayer, "absolute");
    this.container.appendChild(renderLayer);
    // assignments
    this.renderLayer = renderLayer;
    this.nodesLayer = nodesLayer;
    this.uiLayer = uiLayer;
  }
}
