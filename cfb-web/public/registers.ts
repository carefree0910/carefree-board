import { registerDragHandler, registerPointerHandler } from "@carefree0910/cfb-core";
import { PanHandler } from "@carefree0910/cfb-web";
import { registerUI } from "./ui.ts";

export function registerPointerHandlers(): void {
  registerPointerHandler(new PanHandler());
  // make sure the UI is registered before the handlers you want to override
  registerUI();
  registerDragHandler();
}
