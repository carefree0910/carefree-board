import { build } from "@deno/dnt";

export async function buildCore(): Promise<void> {
  const deno = await Deno.readTextFile("./cfb-core/deno.json").then((json) =>
    JSON.parse(json)
  );
  await build({
    typeCheck: "both",
    entryPoints: ["./cfb-core/mod.ts"],
    rootTestDir: "./cfb-core/tests",
    outDir: "./cfb-core/npm",
    shims: {
      deno: {
        test: "dev",
      },
      timers: true,
    },
    package: {
      name: deno.name,
      version: deno.version,
      description: "Core components of the `carefree-board` project.",
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
      Deno.copyFileSync("LICENSE", "cfb-core/npm/LICENSE");
      Deno.copyFileSync("cfb-core/README.md", "cfb-core/npm/README.md");
    },
  });
}
