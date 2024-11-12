import type { IPlugin } from "@carefree0910/cfb-core";

import {
  checkKeys,
  ExecuterPlugin,
  keyboardEvent,
  Logger,
} from "@carefree0910/cfb-core";

export class WebShortcutsPlugin implements IPlugin {
  start(): Promise<void> {
    keyboardEvent.on((e) => {
      if (e.type === "onKeyDown") {
        if (checkKeys(e, ["control", "z"])) {
          const executer = e.world.getPlugin(ExecuterPlugin);
          if (!executer) {
            Logger.warn("`undo` failed: `ExecuterPlugin` is not found in the world");
          } else {
            if (executer.canUndo()) {
              executer.undo();
            }
          }
        } else if (checkKeys(e, ["control", "shift", "z"])) {
          const executer = e.world.getPlugin(ExecuterPlugin);
          if (!executer) {
            Logger.warn("`redo` failed: `ExecuterPlugin` is not found in the world");
          } else {
            if (executer.canRedo()) {
              executer.redo();
            }
          }
        }
      }
    });
    return Promise.resolve();
  }
}
