# `cfb-core`

This module implements the core components of the `carefree-board` project, it contains
some data structures and algorithms to handle the `graph` and the `node`s. It also
implements high level abstractions of event handling, rendering, etc.

## Usage

`cfb-core` only provides the very fundamental stuffs. For more concrete / practical
usages, you may want to check out `cfb-svg` / `cfb-web` modules.

Anyway, here's how you can create a `node` for downstream tasks:

```ts
import { makeSingleNode, Matrix2D, NODE_FACTORY } from "@carefree0910/cfb-core";

const rectangle = makeSingleNode({
  type: "rectangle",
  alias: "rect",
  transform: Matrix2D.from(100, 100, 50, 50),
  params: {
    fillParamsList: [{ type: "color", color: "#ff0000", opacity: 0.25 }],
  },
  z: 0,
});

const json = rectangle.toJson();
const loaded = NODE_FACTORY.fromJson(json);
console.log(rectangle.uuid === loaded.uuid); // true
```
