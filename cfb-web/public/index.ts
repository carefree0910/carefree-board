import {
  AutoRefreshWorld,
  Board,
  EventSystem,
  ExecuterPlugin,
  getUIElements,
  Graph,
  makeSingleNode,
  Matrix2D,
} from "@carefree0910/cfb-core";
import * as web from "@carefree0910/cfb-web";

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
].concat(getUIElements());
const graph = Graph.fromNodes(nodes);
const board = new Board(graph);
const renderer = new web.WebRenderer(board);
const plugins = [
  new ExecuterPlugin(),
];
const pointerHandler = new web.WebPointerHandler();
const eventSystem = new EventSystem([pointerHandler]);
const world = new AutoRefreshWorld({ renderer, plugins, eventSystem });
world.start();

console.log(world);
