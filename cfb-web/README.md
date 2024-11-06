# `cfb-web`

This module implements a web-native renderer for the `carefree-board` project. It will
render the `board` in a web browser, by transpiling the data structures into `dom`
elements.

## Quick Start

We've provided a convenient `deno task` to run a demo for `cfb-web`:

```bash
deno task run:web
```

This task simply executes the [`run_web.ts`](../scripts/web/run_web.ts) script, which
will bundle `cfb-web` and then serve the demo's `index.html` file.

> The procedure mentioned above is easy to integrate into `deno deploy` - that's why I'm
> able to host it at https://cfb-web.deno.dev/!

## Usage

`cfb-web` should be used in a `browser` runtime as its name suggests. It implements the
following layers for the `cfb` project:

- `WebRenderer`: Structured the `dom` hierarchy for `WebRenderNode` to be rendered.
- `WebRenderNode`: Concrete implementations that can transpile `node` → `dom` elements.
- `PointerHandler`: Handles pointer events from the `browser`.

```ts ignore
import {
  EventSystem,
  Graph,
  makeSingleNode,
  Matrix2D,
  World,
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
const renderer = new web.WebRenderer(graph);
const pointerHandler = new web.PointerHandler();
const eventSystem = new EventSystem([pointerHandler]);
const world = new World({ renderer, eventSystem });
world.start().then(() => console.log(world));
```
