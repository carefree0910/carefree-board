import type { ITextNode } from "@carefree0910/cfb-core";

import {
  DragHandler,
  ExecuterPlugin,
  Graph,
  makeSingleNode,
  Matrix2D,
  World,
} from "@carefree0910/cfb-core";
import * as web from "@carefree0910/cfb-web";
import { makeUIs } from "./ui.ts";

const nodes = [
  makeSingleNode({
    type: "rectangle",
    alias: "rect0",
    transform: Matrix2D.from(50, 50, 50, 50),
    params: {
      fillParamsList: [{ type: "color", color: "#ff0000", opacity: 0.25 }],
    },
    z: 0,
  }),
  makeSingleNode({
    type: "rectangle",
    alias: "rect1",
    transform: Matrix2D.from(75, 75, 50, 50),
    params: {
      fillParamsList: [{ type: "color", color: "#00ff00", opacity: 1 }],
    },
    z: 1,
  }),
  makeSingleNode<ITextNode>({
    type: "text",
    alias: "hello",
    transform: Matrix2D.from(50, 150, 100, 50),
    params: {
      content: "Hello, World!",
      fontSize: 24,
      fontWeight: "bold",
    },
    z: 2,
  }),
];
const graph = Graph.fromNodes(nodes);
const renderer = new web.WebRenderer(graph);
const plugins = [
  new ExecuterPlugin(),
  new web.WebWheelPlugin(),
  new web.WebPointerPlugin([
    new web.PanHandler(),
    ...makeUIs(),
    new DragHandler(),
  ]),
  new web.WebKeyboardPlugin(),
  new web.WebShortcutsPlugin(),
  new web.WebZoomPlugin(),
];
const world = new World({ renderer, plugins });
world.start().then(() => console.log(world));
