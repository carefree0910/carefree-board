import { isUndefined, shallowCopy, waitUntil } from "./utils.ts";

export class Queue<T> {
  elements: T[];
  maxLength?: number;

  constructor(...elements: T[]) {
    this.elements = elements;
  }

  get size(): number {
    return this.elements.length;
  }

  get isEmpty(): boolean {
    return this.size === 0;
  }

  get top(): T {
    this._assertNotEmpty();
    return this.elements[0];
  }

  push(...elements: T[]): void {
    if (isUndefined(this.maxLength)) {
      this.elements.push(...elements);
    } else {
      const totalSize = elements.length + this.size;
      const overFlowCount = totalSize > this.maxLength!
        ? totalSize - this.maxLength!
        : 0;
      this.elements.push(...elements);
      if (overFlowCount) this.elements.splice(0, overFlowCount);
    }
  }

  last(): T {
    this._assertNotEmpty();
    const element = this.elements[this.elements.length - 1];
    return element;
  }

  pop(): T {
    this._assertNotEmpty();
    const element = this.elements.shift();
    return element!;
  }

  clear(): void {
    this.elements = [];
  }

  clone(): Queue<T> {
    return new Queue(...shallowCopy(this.elements));
  }

  private _assertNotEmpty(): void {
    if (this.isEmpty) {
      throw Error("current Stack is empty");
    }
  }
}

export interface IAsyncQueue<T> {
  fn: (info: T) => Promise<void>;
  replacable?: boolean;
  replacableCondition?: (last: T, current: T) => boolean;
}
export class AsyncQueue<T> {
  fn: (info: T) => Promise<void>;
  customSchedule?: (queue: Queue<T>, current: T) => void;
  replacableCondition?: (last: T, current: T) => boolean;
  debug: boolean = false;

  private _queue: Queue<T> = new Queue();
  private _executing: boolean = false;
  private _executingInfo: T | undefined = undefined;
  private _replacable: boolean;

  constructor({ fn, replacable = false, replacableCondition }: IAsyncQueue<T>) {
    this.fn = fn;
    this._replacable = replacable;
    this.replacableCondition = replacableCondition;
  }

  get size(): number {
    return this._queue.size;
  }

  get isBusy(): boolean {
    return this._executing;
  }

  get executingInfo(): T | undefined {
    return this._executingInfo;
  }

  // elements[0] will be executed first
  get elements(): T[] {
    return [...this._queue.elements];
  }

  push(info: T): void {
    if (this.debug) {
      console.log("pushed", info);
    }
    if (this.customSchedule) {
      this.customSchedule(this._queue, info);
    } else if (
      this._replacable &&
      this._queue.size > 0 &&
      (!this.replacableCondition ||
        this.replacableCondition(this._queue.last(), info))
    ) {
      this._queue.elements[this._queue.size - 1] = info;
    } else {
      this._queue.push(info);
    }
    if (!this._executing) {
      this._execute();
    }
  }

  async wait(interval: number = 10): Promise<void> {
    await waitUntil(() => !this._executing, { interval });
  }

  private async _execute(): Promise<void> {
    this._executing = true;
    while (!this._queue.isEmpty) {
      this._executingInfo = this._queue.pop();
      await this.fn(this._executingInfo);
    }
    this._executing = false;
    this._executingInfo = undefined;
  }
}
