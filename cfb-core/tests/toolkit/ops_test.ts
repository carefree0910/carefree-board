import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { assertAlmostEquals } from "https://deno.land/std@0.224.0/assert/assert_almost_equals.ts";

import * as mod from "../../mod.ts";

Deno.test("sum", () => {
  assertEquals(mod.sum([1, 2, 3, 4, 5]), 15);
});
Deno.test("mean", () => {
  assertAlmostEquals(mod.mean([1, 2, 3, 4, 5]), 3.0);
});
Deno.test("isClose", () => {
  assertEquals(mod.isClose(1.0, 1.0), true);
  assertEquals(mod.isClose(1.0, 1.0 + 1.0e-7), true);
  assertEquals(mod.isClose(1.0, 1.0 + 1.0e-5), false);
  assertEquals(mod.isClose(1.0, 1.0 + 1.0e-3), false);
  assertEquals(mod.isClose(1.0, 1.0 + 1.0e-1), false);
});
Deno.test("getSafeNumber", () => {
  assertEquals(mod.getSafeNumber(1.0), 1.0);
  assertEquals(mod.getSafeNumber(1.0e-13), 1.0e-12);
  assertEquals(mod.getSafeNumber(-1.0e-13), -1.0e-12);
});
