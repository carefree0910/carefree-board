import { which } from "https://deno.land/x/which@0.3.0/mod.ts";
import { exec } from "./utils.ts";

const npmExecPath = await which("npm");
if (!npmExecPath) {
  console.error("npm not found");
  Deno.exit(1);
}
const packages = ["cfb-core", "cfb-svg", "cfb-web"];
await Promise.all(
  packages.map((pkg) =>
    exec(
      new Deno.Command(npmExecPath, {
        args: ["publish", `./${pkg}/npm/`, "--access", "public"],
      }),
    )
  ),
);
