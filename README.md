# `carefree-board`

The `carefree-board` project, or `cfb` for short, is a lightweight, modular, and
easy-to-use `board` library.

> `board` can be thought of 'drawboard' / 'canvas' / '2D graphics world' / ..., depending
> on what you want to build with it (e.g., a drawing app, an infinite canvas, a 2D game,
> ...).

## Getting Started

`carefree-board` needs [`deno`](https://deno.com/) to run. After you have installed
`deno`, a web-native demo can be launched by:

```bash
deno task run:web
```

This will start the demo at `http://localhost:1245`, and you can play with the `cfb`.
Currently this demo only supports:

1. Display two squares on the screen.
2. Respond to mouse clicks - it will log out the nodes being clicked in the console.

## Project Status

`carefree-board` is still in its **VERY EARLY** stage, and mainly serves as a POC. The
final goal is to define a set of abstract interfaces that can be extended to everything
related to 2D graphics.

## Project Hierachy

All submodules are structured under a `deno` workspace, and their functionalities are as
follows:

- `cfb-core`: implements the core components of `cfb`.
- `cfb-svg`: implements `svg` exporters for `cfb`.
- `cfb-web`: a web-native renderer for `cfb` that transpiles the data structures into
  `dom` elements.

## Hybrid monorepo in `deno`

It **REALLY** took me couple of days to figure out how to manage a _hybrid_ `deno`
monorepo. Let me define it - a _hybrid_ `deno` monorepo is a monorepo that:

- All members are `deno` first modules.
- Some members are `browser` specific modules, and need to have a runnable frontend demo.

The second part is where nightmare begins. I struggled quite a bit to figure out how to
correctly do the linkings / bundlings / servings. Finally I made it to what I think
simple and elegant, and I'd like to share some experience here:

> Hint: after all these setups, everything is **TIDY** and **BLAZINGLY FAST** compared to
> the traditional `webpack` / `rollup` / `tsconfig` / `package.json` / ... mess, which
> makes me feel all the efforts are worth it!

1. Export everything in `main.ts` (to distinguish from `mod.ts` that can be used in both
   `node` and `browser` environments) ([exmaple](./cfb-web/main.ts)).
2. Write startup codes in `public/index.ts`, which may import the workspace members and
   setup the application ([example](./cfb-web/public/index.ts)).
3. Use [`esbuild`](https://github.com/evanw/esbuild) in a `deno` script to bundle
   `index.ts` (not `main.ts`!) into a single `js` file. It's common practice here to
   `watch` for changes ([example](./scripts/web/dev_web.ts)).
4. Write an `index.html` that includes the bundled `js` file. If the startup codes need
   to refer to some concrete `dom` elements, make sure to include the `<script>` tag
   after the elements are defined ([example](./cfb-web/public/index.html)).
5. Use `Deno.serve` to serve the `index.html` ([example](./scripts/web/serve_web.ts)).
6. Happy coding!

> Some implicit steps:
>
> - Make sure the workspace memebers are imported as `jsr:${name}`, not directly
>   `${name}`.
> - Specify `imports` in [`deno.json`](./deno.json)
>
> These steps are to make [`dnt`](https://github.com/denoland/dnt) /
> [`esbuild`](https://github.com/evanw/esbuild) happy. I think they can (and maybe
> should) be skipped once the `deno` ecosystem becomes more mature.

## Development

A common `.vscode/settings.json` for this project is as follows:

```json
{
  "deno.enable": true,
  "deno.lint": true,
  "[json]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "[markdown]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  },
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  }
}
```

I did not use

```json
{
  ...,
  "editor.defaultFormatter": "denoland.vscode-deno"
}
```

directly because I found its priority is not high enough in my case.

### `cfb-web`

A common setup for developing `cfb-web` is as follows:

1. Open two terminals.
2. In the first terminal, run `deno task dev:web`, this should be able to watch **ALL**
   changes in the workspace.
3. In the second terminal, run `deno task start:web`, this should start a local server at
   `http://localhost:1245` and you can test the changes in the browser. Notice that there
   are no hot-reload, so you need to refresh the page manually when changes are made.
