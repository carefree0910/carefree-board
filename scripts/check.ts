import { exec, runTests } from "./utils.ts";
import { cleanup } from "./00_cleanup.ts";
import { buildCore } from "./01_build_core.ts";
import { buildSvg } from "./02_build_svg.ts";
import { buildWeb } from "./03_build_web.ts";

await Promise.all([
  exec(new Deno.Command(Deno.execPath(), { args: ["fmt"] })),
  exec(
    new Deno.Command(
      Deno.execPath(),
      { args: ["publish", "--dry-run", "--allow-dirty"] },
    ),
  ),
  cleanup(),
]);

await Promise.all([
  exec(
    new Deno.Command(
      Deno.execPath(),
      { args: ["lint"] },
    ),
  ),
  runTests(),
]);

await Promise.all([
  buildCore(),
  buildSvg(),
  buildWeb(),
]);
