/**
 * Interface of a synchronous context manager.
 */
export interface IContext<T> {
  enter: () => T;
  exit: (input: T) => void;
}
/**
 * Interface of an asynchronous context manager.
 */
export interface IAsyncContext<T> {
  enter: () => Promise<T>;
  exit: (input: T) => Promise<void>;
}

/**
 * A synchronous context manager.
 */
export class Context<T> implements IContext<T> {
  constructor(
    public enter: () => T,
    public exit: (input: T) => void,
  ) {}

  run<R>(fn: (input: T) => R): R {
    const input = this.enter();
    try {
      return fn(input);
    } finally {
      this.exit(input);
    }
  }
}
/**
 * An asynchronous context manager.
 */
export class AsyncContext<T> implements IAsyncContext<T> {
  constructor(
    public enter: () => Promise<T>,
    public exit: (input: T) => Promise<void>,
  ) {}

  async run<R>(fn: (input: T) => Promise<R>): Promise<R> {
    const input = await this.enter();
    try {
      return fn(input);
    } finally {
      await this.exit(input);
    }
  }
}
