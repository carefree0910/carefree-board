function argFnFactory(
  fn: (pair: number[], history: number[]) => number[],
): (array: number[]) => number {
  return (array: number[]) => array.map((value, idx) => [value, idx]).reduce(fn)[1];
}
export const argMax: (array: number[]) => number = argFnFactory((min, el) =>
  el[0] > min[0] ? el : min
);
export const argMin: (array: number[]) => number = argFnFactory((max, el) =>
  el[0] < max[0] ? el : max
);

export function sum(elements: number[], initialValue: number = 0): number {
  return elements.reduce((current, element) => current + element, initialValue);
}

export function mean(elements: number[], initialValue: number = 0): number {
  return sum(elements, initialValue) / elements.length;
}

export type IsCloseOptions = { atol?: number; rtol?: number };
export function isClose(a: number, b: number, option?: IsCloseOptions): boolean {
  option ??= {};
  const atol = option.atol ?? 1.0e-6;
  const rtol = option.rtol ?? 1.0e-4;
  const diff = Math.abs(a - b);
  a = Math.max(a, 1.0e-8);
  b = Math.max(b, 1.0e-8);
  if (
    diff >= atol ||
    Math.abs(diff / a) >= rtol ||
    Math.abs(diff / b) >= rtol
  ) {
    return false;
  }
  return true;
}

export function getSafeNumber(num: number, min: number = 1.0e-12): number {
  if (Math.abs(num) >= min) return num;
  return min * (Math.sign(num) || 1.0);
}

export function getTheta(rotation: number): number {
  return (Math.PI * rotation) / 180.0;
}

export function getRotation(theta: number): number {
  return (180.0 * theta) / Math.PI;
}
