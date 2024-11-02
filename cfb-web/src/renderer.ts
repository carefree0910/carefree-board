import type { IBoard } from "@carefree0910/cfb-core";

import { Renderer } from "@carefree0910/cfb-core";

export class WebRenderer extends Renderer {
  container: HTMLDivElement;
  boardLayer: HTMLDivElement;
  nodesLayer: HTMLDivElement;
  uiLayer: HTMLDivElement;

  constructor(board: IBoard) {
    super(board);
    this.container = document.getElementById("container")! as HTMLDivElement;
    // board
    const boardLayer = document.createElement("div");
    boardLayer.setAttribute("id", "boardLayer");
    boardLayer.style.userSelect = "none";
    boardLayer.style.overflow = "hidden";
    // mainLayer
    const mainLayer = document.createElement("div");
    mainLayer.setAttribute("id", "mainLayer");
    mainLayer.setAttribute("pointer-events", "none");
    boardLayer.appendChild(mainLayer);
    // nodesLayer
    const nodesLayer = document.createElement("div");
    nodesLayer.setAttribute("id", "nodesLayer");
    nodesLayer.setAttribute("pointer-events", "none");
    mainLayer.appendChild(nodesLayer);
    // uiLayer
    const uiLayer = document.createElement("div");
    uiLayer.setAttribute("id", "uiLayer");
    uiLayer.setAttribute("pointer-events", "none");
    boardLayer.appendChild(uiLayer);
    // attributes
    const setCommonAttributes = (div: HTMLDivElement, position: string) => {
      div.style.width = "100%";
      div.style.height = "100%";
      div.style.pointerEvents = "none";
      div.style.position = position;
    };
    setCommonAttributes(boardLayer, "relative");
    setCommonAttributes(nodesLayer, "relative");
    setCommonAttributes(mainLayer, "absolute");
    setCommonAttributes(uiLayer, "absolute");
    this.container.appendChild(boardLayer);
    // assignments
    this.boardLayer = boardLayer;
    this.nodesLayer = nodesLayer;
    this.uiLayer = uiLayer;
  }
}
