import { exec, runTests } from "./utils.ts";
import { cleanup } from "./00_cleanup.ts";
import { buildCore } from "./01_build_core.ts";
import { buildSvg } from "./02_build_svg.ts";
import { buildWeb } from "./03_build_web.ts";

let responses;
responses = await Promise.all([
  exec(new Deno.Command(Deno.execPath(), { args: ["fmt"] })),
  exec(
    new Deno.Command(
      Deno.execPath(),
      { args: ["publish", "--dry-run", "--allow-dirty"] },
    ),
  ),
  cleanup(),
]);
if (responses.some((res) => !!res && !res.success)) {
  console.error("Failed to run pre-publish checks.");
  Deno.exit(1);
}

responses = await Promise.all([
  exec(
    new Deno.Command(
      Deno.execPath(),
      { args: ["lint"] },
    ),
  ),
  runTests(),
]);
if (responses.some((res) => !!res && !res.success)) {
  console.error("Failed to run lint / tests.");
  Deno.exit(1);
}

await Promise.all([
  buildCore(),
  buildSvg(),
  buildWeb(),
]);
