import { cleanup } from "./00_cleanup.ts";
import { buildCore } from "./01_build_core.ts";
import { buildSvg } from "./02_build_svg.ts";
import { buildWeb } from "./03_build_web.ts";

await cleanup();
await Promise.all([
  buildCore(),
  buildSvg(),
  buildWeb(),
]);
