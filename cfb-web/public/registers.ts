import { registerDragHandler } from "@carefree0910/cfb-core";
import { registerUI } from "./ui.ts";

export function registerPointerHandlers(): void {
  // make sure the UI is registered first
  registerUI();
  registerDragHandler();
}
