import { buildPackage } from "./utils.ts";

export async function buildSvg(): Promise<void> {
  await buildPackage({
    pkg: "cfb-svg",
    entryFile: "mod.ts",
    description: "SVG exporter for the `carefree-board` project.",
    typeCheck: true,
  });
}
