import { emptyDir } from "@deno/dnt";

export async function cleanup() {
  await emptyDir("./cfb-core/npm");
  await emptyDir("./cfb-svg/npm");
  await emptyDir("./cfb-web/npm");
  await emptyDir("./cfb-web/dist");
}
