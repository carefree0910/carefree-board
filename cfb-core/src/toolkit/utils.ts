// type utils

/**
 * Indicates an empty object.
 */
export type Empty = Record<string | number | symbol, never>;
/**
 * A dictionary with string keys.
 */
export type Dictionary<T> = { [key: string]: T };

// array utils

export function flat<T>(array: T[][]): T[] {
  return ([] as T[]).concat(...array);
}

// common utils

export function isUndefined<T>(element: T | undefined): element is undefined {
  return element == undefined;
}

export function setDefault<T, K extends keyof T>(
  d: T,
  key: K,
  value: NonNullable<T[K]>,
): NonNullable<T[K]> {
  const existing = d[key];
  if (!isUndefined(existing)) {
    return existing as NonNullable<T[K]>;
  }
  d[key] = value;
  return value;
}

export function isString(element: unknown): element is string {
  return Object.prototype.toString.call(element) === "[object String]";
}
export function isNumber(element: unknown): element is number {
  return typeof element === "number";
}
export function isValidNumber(element: unknown): element is number {
  return isNumber(element) && !Number.isNaN(element);
}

export function shallowCopy<T>(element: T): T {
  if (isUndefined(element)) {
    return element;
  }
  if (
    isString(element) ||
    isNumber(element) ||
    typeof element === "bigint" ||
    typeof element === "boolean" ||
    typeof element === "function"
  ) {
    return element;
  }
  if (Array.isArray(element)) {
    return element.map((n) => shallowCopy(n)) as T;
  }
  if (element instanceof Set) {
    return new Set(Array.from(element).map((n) => shallowCopy(n))) as T;
  }
  if (element instanceof Map) {
    return new Map(
      Array.from(element).map(([k, v]) => [shallowCopy(k), shallowCopy(v)]),
    ) as T;
  }
  // deno-lint-ignore no-explicit-any
  const copied: any = {};
  for (const key in element) {
    copied[key] = shallowCopy(element[key]);
  }
  return copied;
}

export function replaceAll(str: string, search: string, replace: string): string {
  function _fallback() {
    return str.replace(new RegExp(search, "g"), replace);
  }

  try {
    if (!isUndefined(String.prototype.replaceAll)) {
      return str.replaceAll(search, replace);
    }
    return _fallback();
  } catch (e) {
    console.warn(`'replaceAll' fallback due to ${e}`);
    return _fallback();
  }
}

// async utils

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface IWaitUntil {
  interval?: number;
  timeout?: number;
}
export async function waitUntil(
  fn: () => boolean,
  option?: IWaitUntil,
): Promise<void> {
  option ??= {};
  const interval = option.interval ?? 100;
  const time = option.timeout ? Date.now() : undefined;
  while (!fn()) {
    await sleep(interval);
    if (!!time && !!option.timeout) {
      if (Date.now() - time >= option.timeout) {
        throw new Error(`'waitUntil' timeout (${option.timeout}ms)`);
      }
    }
  }
}

export type Callbacks<R, FR> = {
  success: (value: R) => Promise<void>;
  failed: (e: unknown) => Promise<FR>;
};
export type SafeCallOptions = {
  retry?: number;
  retryInterval?: number;
};
export async function safeCall<R, FR>(
  fn: () => Promise<R>,
  callbacks: Callbacks<R, FR>,
  option?: SafeCallOptions,
): Promise<R | FR> {
  async function _inner(): Promise<
    { success: true; data: R } | { success: false; data: unknown }
  > {
    try {
      const data = await fn();
      await callbacks.success(data);
      return { success: true, data };
    } catch (e) {
      return { success: false, data: e };
    }
  }

  option ??= {};
  const retry = option.retry ?? 1;
  const retryInterval = option.retryInterval ?? 1000;
  let counter = 0;
  while (true) {
    const res = await _inner();
    if (res.success) {
      return res.data;
    }
    counter += 1;
    if (counter >= retry) {
      return callbacks.failed(res.data);
    }
    await sleep(retryInterval);
  }
}
