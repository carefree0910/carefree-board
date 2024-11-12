import type { IWheelEvent } from "@carefree0910/cfb-core";

import { Point } from "@carefree0910/cfb-core";

export function getNormalizedWheelDelta(
  { deltaX, deltaY }: IWheelEvent,
  ceil: number,
): Point {
  const sx = Math.sign(deltaX);
  const sy = Math.sign(deltaY);
  const ax = sx * deltaX;
  const ay = sy * deltaY;
  deltaX = sx * Math.min(ceil, ax);
  deltaY = sy * Math.min(ceil, ay);
  return new Point(deltaX, deltaY);
}
