import { buildPackage } from "./utils.ts";

export async function buildWeb(): Promise<void> {
  await buildPackage({
    pkg: "cfb-web",
    entryFile: "main.ts",
    description: "A web-native renderer for the `carefree-board` project.",
    typeCheck: false,
  });
}
