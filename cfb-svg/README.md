# `cfb-svg`

This module aims to export SVGs for the (single) nodes defined in the `cfb-core` module.

## Usage

`cfb-svg` supports `browser` runtime natively. To use it in `node` / `deno` runtime, you
need to patch the `window` / `document` with `svgdom`:

```ts
// import { assertEquals } from "assert_equals";
import { createSVGWindow } from "npm:svgdom";
import { registerWindow } from "@svgdotjs/svg.js";
import { makeSingleNode, Matrix2D } from "@carefree0910/cfb-core";
import { ShapeNodeSVGExporter } from "@carefree0910/cfb-svg";

const window = createSVGWindow();
const document = window.document;
registerWindow(window, document);

const rectangle = makeSingleNode({
  type: "rectangle",
  alias: "rect",
  transform: Matrix2D.from(100, 100, 50, 50),
  params: {
    fillParamsList: [{ type: "color", color: "#ff0000", opacity: 0.25 }],
  },
  z: 0,
});
const exporter = new ShapeNodeSVGExporter();
const exported = await exporter.export([rectangle]);
/**
 * <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="50">
 *   <g transform="matrix(1,0,0,1,100,100)" id="rect">
 *     <path d="M 0 0L 50 0L 50 50L 0 50Z" fill-opacity="0.25" fill="#ff0000"></path>
 *   </g>
 * </svg>
 */
console.log(exported.svg());
```
