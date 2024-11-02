import { build } from "@deno/dnt";

export async function buildSvg(): Promise<void> {
  const deno = await Deno.readTextFile("./cfb-svg/deno.json").then((json) =>
    JSON.parse(json)
  );
  await build({
    typeCheck: "both",
    entryPoints: ["./cfb-svg/mod.ts"],
    rootTestDir: "./cfb-svg/tests",
    outDir: "./cfb-svg/npm",
    importMap: "./deno.json",
    shims: {
      deno: {
        test: "dev",
      },
    },
    package: {
      name: deno.name,
      version: deno.version,
      description: "SVG exporter for the `carefree-board` project.",
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
      Deno.copyFileSync("LICENSE", "cfb-svg/npm/LICENSE");
      Deno.copyFileSync("cfb-svg/README.md", "cfb-svg/npm/README.md");
    },
  });
}
