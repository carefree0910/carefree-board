import { which } from "https://deno.land/x/which@0.3.0/mod.ts";
import { exec, getPackages } from "./utils.ts";

const npmExecPath = await which("npm");
if (!npmExecPath) {
  console.error("npm not found!");
  Deno.exit(1);
}
const statuses = await Promise.all(
  getPackages().map((pkg) =>
    exec(
      new Deno.Command(npmExecPath, {
        args: ["publish", `./${pkg}/npm/`, "--access", "public"],
      }),
    )
  ),
);
if (statuses.some((status) => !status.success)) {
  console.error("Failed to publish npm packages!");
  Deno.exit(1);
}
