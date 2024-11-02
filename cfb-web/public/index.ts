import {
  AutoRefreshWorld,
  Board,
  EventSystem,
  Graph,
  Matrix2D,
  RectangleNode,
} from "@carefree0910/cfb-core";
import * as web from "@carefree0910/cfb-web";

const nodes = [
  new RectangleNode(
    "0",
    "rect0",
    Matrix2D.from(50, 50, 50, 50),
    {
      fillParamsList: [{ type: "color", color: "#ff0000", opacity: 0.25 }],
    },
    0,
  ),
  new RectangleNode(
    "1",
    "rect1",
    Matrix2D.from(75, 75, 50, 50),
    { fillParamsList: [{ type: "color", color: "#00ff00", opacity: 1 }] },
    1,
  ),
];
const graph = Graph.fromNodes(nodes);
const board = new Board(graph);
const renderer = new web.WebRenderer(board);
const pointerHandler = new web.PointerHandler();
const eventSystem = new EventSystem([pointerHandler]);
const world = new AutoRefreshWorld({ renderer, eventSystem });
world.start();

console.log(world);
