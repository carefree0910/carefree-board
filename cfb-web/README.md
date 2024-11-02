# `cfb-web`

This module implements a web-native renderer for the `carefree-board` project. It will
render the `board` in a web browser, by transpiling the data structures into `dom`
elements.

## Usage

`cfb-web` should be used in a `browser` runtime as its name suggests. It implements the
following layers for the `cfb` project:

- `WebRenderer`: Structured the `dom` hierarchy for `WebBoardNode` to be rendered.
- `WebBoardNode`: Concrete implementations that can transpile `node` → `dom` elements.
- `PointerHandler`: Handles pointer events from the `browser`.

Besides, `cfb-web` uses `AutoRefreshWorld` directly to refresh the above layers.

```ts ignore
import {
  AutoRefreshWorld,
  Board,
  EventSystem,
  Graph,
  makeSingleNode,
  Matrix2D,
} from "@carefree0910/cfb-core";
import * as web from "@carefree0910/cfb-web";

const node = makeSingleNode({
  type: "rectangle",
  uuid: "0",
  alias: "rect",
  transform: Matrix2D.from(50, 50, 50, 50),
  params: {
    fillParamsList: [{ type: "color", color: "#ff0000", opacity: 0.25 }],
  },
  z: 0,
});
const graph = Graph.fromNodes([node]);
const board = new Board(graph);
const renderer = new web.WebRenderer(board);
const pointerHandler = new web.PointerHandler();
const eventSystem = new EventSystem([pointerHandler]);
const world = new AutoRefreshWorld({ renderer, eventSystem });
world.start();

console.log(world);
```
