import * as esbuild from "https://deno.land/x/esbuild@v0.20.2/mod.js";
import { serveFile } from "jsr:@std/http/file-server";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.0";

export function exec(cmd: Deno.Command): Promise<Deno.CommandStatus> {
  return cmd.spawn().status;
}

// cfb-web

interface BundleWebOptions {
  minify: boolean;
}
export async function bundleWeb(opt: BundleWebOptions): Promise<boolean> {
  console.log("%cBundling `cfb-web`...", "color:gray");
  const denoURL = import.meta.resolve("../deno.json");
  console.log(`%cUsing import map: ${denoURL}`, "color:gray");
  const denoSettings = await fetch(denoURL).then((res) => res.json());
  const importMap = { imports: denoSettings.imports };
  const tempFile = "./__imports.json";
  Deno.createSync(tempFile);
  await Deno.writeTextFile(tempFile, JSON.stringify(importMap));
  const importMapURL = import.meta.resolve(`.${tempFile}`);
  const result = await esbuild.build({
    plugins: [...denoPlugins({ importMapURL })],
    entryPoints: ["./cfb-web/public/index.ts"],
    outdir: "./cfb-web/dist",
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "esnext",
    minify: opt.minify,
    sourcemap: true,
    treeShaking: true,
  });
  Deno.removeSync(tempFile);
  if (result.errors.length === 0) {
    console.log("%cBundling `cfb-web` completed!", "color:green");
    return true;
  } else {
    console.error(result.errors);
    return false;
  }
}

export function serveWeb(): void {
  Deno.serve({ port: 1245 }, (req) => {
    let path = new URL(req.url).pathname;
    if (path === "/") {
      path = "/index.html";
    }
    if (!path.startsWith("/dist")) {
      path = "/public" + path;
    }
    const filePath = `./cfb-web${path}`;
    try {
      return serveFile(req, filePath);
    } catch {
      console.error(`'${filePath}' not found`);
      return new Response("Not found", { status: 404 });
    }
  });
}
