import type { ISingleNodeR, ISolidFillParams, IWorld } from "@carefree0910/cfb-core";

import {
  DirtyStatus,
  ExecuterPlugin,
  Logger,
  makeUIElement,
  Matrix2D,
  registerExecuterEvent,
} from "@carefree0910/cfb-core";

function setFill(
  node: ISingleNodeR,
  world: IWorld,
  color: string,
  opacity: number,
): Promise<void> {
  const fillParams = node.params.fillParamsList![0] as ISolidFillParams;
  fillParams.color = color;
  fillParams.opacity = opacity;
  world.setDirtyStatus(node.alias, DirtyStatus.CONTENT_DIRTY, true);
  return Promise.resolve();
}

function makeButton(
  alias: string,
  transform: Matrix2D,
  activatedColor: string,
  isActivated: (executer: ExecuterPlugin | null) => boolean,
  onClick: (executer: ExecuterPlugin) => void,
): void {
  makeUIElement({
    store: { activated: false },
    nodeData: {
      type: "rectangle",
      alias,
      transform,
      params: {
        tag: "ui",
        fillParamsList: [{ type: "color", color: deactivatedColor, opacity: 0.25 }],
      },
      z: 0,
    },
    callbacks: {
      onBind: ({ world, store }) => {
        registerExecuterEvent(() => {
          const executer = world.getPlugin(ExecuterPlugin);
          const activated = isActivated(executer);
          if (activated !== store.getter("activated")) {
            store.setter("activated", activated, world);
          }
        });
      },
      onIdle: ({ node, world, store }) => {
        if (store.getter("activated")) {
          setFill(node, world, activatedColor, 0.25);
        } else {
          setFill(node, world, deactivatedColor, 0.25);
        }
      },
      onEnter: ({ node, world, store }) => {
        if (store.getter("activated")) {
          setFill(node, world, activatedColor, 0.4);
        } else {
          setFill(node, world, deactivatedColor, 0.25);
        }
      },
      onPress: ({ node, world, store }) => {
        if (store.getter("activated")) {
          setFill(node, world, activatedColor, 0.6);
        } else {
          setFill(node, world, deactivatedColor, 0.25);
        }
      },
      onClick: ({ world }) => {
        const executer = world.getPlugin(ExecuterPlugin);
        if (!executer) {
          Logger.warn("`ExecuterPlugin` is not found, cannot undo.");
        } else {
          onClick(executer);
        }
      },
    },
  });
}

const undoColor = "#ff00ff";
const redoColor = "#00ffff";
const deactivatedColor = "#000000";

makeButton(
  "undo",
  Matrix2D.from(200, 50, 80, 50),
  undoColor,
  (executer) => executer?.canUndo() ?? false,
  (executer) => {
    if (executer.canUndo()) {
      executer.undo();
    }
  },
);
makeButton(
  "redo",
  Matrix2D.from(300, 50, 80, 50),
  redoColor,
  (executer) => executer?.canRedo() ?? false,
  (executer) => {
    if (executer.canRedo()) {
      executer.redo();
    }
  },
);
