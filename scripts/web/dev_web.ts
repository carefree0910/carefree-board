import * as esbuild from "https://deno.land/x/esbuild@v0.20.2/mod.js";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.0";

console.log("%cBundling `cfb-web`...", "color:gray");
const importMapURL = import.meta.resolve("../../imports.json");
console.log(`%cUsing import map: ${importMapURL}`, "color:gray");
const context = await esbuild.context({
  plugins: [...denoPlugins({ importMapURL })],
  entryPoints: ["./cfb-web/public/index.ts"],
  outdir: "./cfb-web/dist",
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "esnext",
  minify: false,
  sourcemap: true,
  treeShaking: true,
});
console.log("%cContext created, watching for changes...", "color:green");
console.log("%cPress Ctrl+C to stop watching.", "color:gray");
await context.watch();
