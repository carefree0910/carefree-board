import type {
  IGroup,
  IGroupNode,
  IMakeGroupNode,
  ISolidFillParams,
  ITextNode,
  IWorld,
  Matrix2DFields,
} from "@carefree0910/cfb-core";

import {
  BBox,
  DirtyStatus,
  ExecuterPlugin,
  Logger,
  makeUIElement,
  Matrix2D,
  registerExecuterEvent,
  TargetQueue,
} from "@carefree0910/cfb-core";
import { getFontWH } from "./utils.ts";

function setFill(
  node: IGroup,
  world: IWorld,
  color: string,
  opacity: number,
): Promise<void> {
  const children = node.children;
  const bg = children[0];
  const text = children[1] as ITextNode;
  const fillParams = bg.params.fillParamsList![0] as ISolidFillParams;
  fillParams.color = color;
  fillParams.opacity = opacity;
  text.params.opacity = Math.min(opacity * 2, 1);
  world.setRenderInfo(node.alias, {
    dirtyStatus: DirtyStatus.CONTENT_DIRTY,
    targetQueue: TargetQueue.IMMEDIATE,
  }, true);
  return Promise.resolve();
}

function getCenterTransform(
  content: string,
  fontSize: number,
  bounding: Matrix2D,
): Matrix2DFields {
  const { w, h } = getFontWH({ content, fontSize });
  let bbox = BBox.from(w, h);
  bbox = bbox.move(new BBox(bounding).center.subtract(bbox.center));
  return bbox.fields;
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
      type: "group",
      alias: `${alias}Button`,
      params: { tag: "ui" },
      transform: Matrix2D.identity(),
      z: 0,
      children: [
        {
          type: "rectangle",
          alias: `${alias}ButtonBackground`,
          transform,
          params: {
            tag: "ui",
            fillParamsList: [{ type: "color", color: deactivatedColor, opacity: 0.1 }],
          },
          z: 0,
        },
        {
          type: "text",
          alias: `${alias}ButtonText`,
          transform: getCenterTransform(alias, 24, transform),
          params: {
            tag: "ui",
            content: alias,
            fontSize: 22,
            fontWeight: "bold",
            opacity: 0.2,
          },
          z: -1,
        },
      ],
    } as IMakeGroupNode<IGroupNode>,
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
          setFill(node, world, deactivatedColor, 0.1);
        }
      },
      onEnter: ({ node, world, store }) => {
        if (store.getter("activated")) {
          setFill(node, world, activatedColor, 0.4);
        } else {
          setFill(node, world, deactivatedColor, 0.1);
        }
      },
      onPress: ({ node, world, store }) => {
        if (store.getter("activated")) {
          setFill(node, world, activatedColor, 0.6);
        } else {
          setFill(node, world, deactivatedColor, 0.1);
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
  "Undo",
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
  "Redo",
  Matrix2D.from(300, 50, 80, 50),
  redoColor,
  (executer) => executer?.canRedo() ?? false,
  (executer) => {
    if (executer.canRedo()) {
      executer.redo();
    }
  },
);
