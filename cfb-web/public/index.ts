import {
  AutoRefreshWorld,
  Board,
  EventSystem,
  Graph,
  makeSingleNode,
  Matrix2D,
} from "@carefree0910/cfb-core";
import * as web from "@carefree0910/cfb-web";

const nodes = [
  makeSingleNode({
    type: "rectangle",
    uuid: "0",
    alias: "rect0",
    transform: Matrix2D.from(50, 50, 50, 50),
    params: {
      fillParamsList: [{ type: "color", color: "#ff0000", opacity: 0.25 }],
    },
    z: 0,
  }),
  makeSingleNode({
    type: "rectangle",
    uuid: "1",
    alias: "rect1",
    transform: Matrix2D.from(75, 75, 50, 50),
    params: {
      fillParamsList: [{ type: "color", color: "#00ff00", opacity: 1 }],
    },
    z: 1,
  }),
];
const graph = Graph.fromNodes(nodes);
const board = new Board(graph);
const renderer = new web.WebRenderer(board);
const pointerHandler = new web.WebPointerHandler();
const eventSystem = new EventSystem([pointerHandler]);
const world = new AutoRefreshWorld({ renderer, eventSystem });
world.start();

console.log(world);
