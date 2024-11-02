import { buildPackage } from "./utils.ts";

export async function buildCore(): Promise<void> {
  await buildPackage({
    pkg: "cfb-core",
    entryFile: "mod.ts",
    description: "Core components of the `carefree-board` project.",
    typeCheck: true,
    shims: {
      timers: true,
    },
  });
}
