import { build } from "@deno/dnt";

export async function buildWeb(): Promise<void> {
  const deno = await Deno.readTextFile("./cfb-web/deno.json").then((json) =>
    JSON.parse(json)
  );
  await build({
    typeCheck: false,
    entryPoints: ["./cfb-web/main.ts"],
    rootTestDir: "./cfb-web/tests",
    outDir: "./cfb-web/npm",
    importMap: "./deno.json",
    shims: {
      deno: {
        test: "dev",
      },
    },
    package: {
      name: deno.name,
      version: deno.version,
      description: "A web-native renderer for the `carefree-board` project.",
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
      Deno.copyFileSync("LICENSE", "cfb-web/npm/LICENSE");
      Deno.copyFileSync("cfb-web/README.md", "cfb-web/npm/README.md");
    },
  });
}
