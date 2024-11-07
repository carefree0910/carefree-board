import { registerDragProcessor } from "@carefree0910/cfb-core";
import { registerUI } from "./ui.ts";

export function registerPointerProcessors(): void {
  // make sure the UI is registered first
  registerUI();
  registerDragProcessor();
}
