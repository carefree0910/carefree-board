import { assertEquals } from "assert_equals";

import * as mod from "../../mod.ts";

Deno.test("parseColor", () => {
  assertEquals(mod.parseColor("#ff0000"), 16711680);
  assertEquals(mod.parseColor("#00ff00"), 65280);
  assertEquals(mod.parseColor("#0000ff"), 255);
  assertEquals(mod.parseColor("#000000"), 0);
  assertEquals(mod.parseColor("#ffffff"), 16777215);
});
Deno.test("clipColor", () => {
  assertEquals(mod.clipColor(0), 0);
  assertEquals(mod.clipColor(255), 255);
  assertEquals(mod.clipColor(256), 255);
  assertEquals(mod.clipColor(-1), 0);
});
