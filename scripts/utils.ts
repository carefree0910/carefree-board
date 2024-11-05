import type { ShimOptions } from "@deno/dnt";

import * as esbuild from "https://deno.land/x/esbuild@v0.20.2/mod.js";
import { build } from "@deno/dnt";
import { serveFile } from "jsr:@std/http/file-server";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.0";

export function exec(cmd: Deno.Command): Promise<Deno.CommandStatus> {
  return cmd.spawn().status;
}

export function runTests(): Promise<Deno.CommandStatus> {
  return exec(
    new Deno.Command(
      Deno.execPath(),
      { args: ["test", "--doc", "--quiet", "--no-check"] },
    ),
  );
}

export function getPackages(): string[] {
  const packages: string[] = [];
  for (const pkg of Deno.readDirSync(".")) {
    if (pkg.isDirectory && pkg.name.startsWith("cfb-")) {
      packages.push(pkg.name);
    }
  }
  return packages;
}

interface IBuildPackage {
  pkg: string;
  entryFile: string;
  description: string;
  typeCheck: boolean;
  shims?: ShimOptions;
}
export async function buildPackage(
  { pkg, entryFile, description, typeCheck }: IBuildPackage,
): Promise<void> {
  const deno = await Deno.readTextFile(`./${pkg}/deno.json`).then((json) =>
    JSON.parse(json)
  );
  await build({
    typeCheck: typeCheck ? "both" : false,
    entryPoints: [`./${pkg}/${entryFile}`],
    rootTestDir: `./${pkg}`,
    outDir: `./${pkg}/npm`,
    importMap: "./imports.json",
    shims: {
      deno: {
        test: "dev",
      },
    },
    package: {
      name: deno.name,
      version: deno.version,
      description,
      license: "MIT",
      repository: {
        type: "git",
        url: "git+https://github.com/carefree0910/carefree-board.git",
      },
      bugs: {
        url: "https://github.com/carefree0910/carefree-board/issues",
      },
    },
    postBuild() {
      Deno.copyFileSync("LICENSE", `${pkg}/npm/LICENSE`);
      Deno.copyFileSync(`${pkg}/README.md`, `${pkg}/npm/README.md`);
    },
  });
}

// cfb-web

interface IBundleWeb {
  minify: boolean;
}
export async function bundleWeb({ minify }: IBundleWeb): Promise<boolean> {
  console.log("%cBundling `cfb-web`...", "color:gray");
  const importMapURL = import.meta.resolve("../imports.json");
  console.log(`%cUsing import map: ${importMapURL}`, "color:gray");
  const result = await esbuild.build({
    plugins: [...denoPlugins({ importMapURL })],
    entryPoints: ["./cfb-web/public/index.ts"],
    outdir: "./cfb-web/dist",
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "esnext",
    minify,
    sourcemap: true,
    treeShaking: true,
  });
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
