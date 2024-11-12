import { Queue } from "./queue.ts";
import { JsonSerializableBase, JsonSerializableFactoryBase } from "./serialization.ts";
import { isUndefined, shallowCopy } from "./utils.ts";

/**
 * The Json data of a {@link Stack}.
 */
export type RecordData<T> = T[];
class StackFactory<T> extends JsonSerializableFactoryBase<RecordData<T>, Stack<T>> {
  fromJsonData(data: RecordData<T>): Stack<T> {
    const stack = new Stack<T>();
    stack.elements = data;
    return stack;
  }
}
const stackFactory = new StackFactory();
/**
 * The `stack` data structure.
 */
export class Stack<T> extends JsonSerializableBase<RecordData<T>, StackFactory<T>> {
  elements: T[];
  maxLength?: number;

  constructor(...elements: T[]) {
    super();
    this.elements = elements;
  }

  get factory(): StackFactory<T> {
    return stackFactory as StackFactory<T>;
  }

  get size(): number {
    return this.elements.length;
  }
  get isEmpty(): boolean {
    return this.size === 0;
  }
  get top(): T {
    if (this.isEmpty) {
      throw Error("current Stack is empty");
    }
    return this.elements[this.size - 1];
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
  pop(): T {
    if (this.isEmpty) {
      throw Error("current Stack is empty");
    }
    const element = this.elements.pop();
    return element!;
  }
  clear(): void {
    this.elements.length = 0;
  }
  clone(): Queue<T> {
    return new Queue(...shallowCopy(this.elements));
  }

  toJsonData(): RecordData<T> {
    return this.elements;
  }
}

/**
 * The Json data of a {@link RecordStack}.
 */
export type RecordStackData<T> = {
  records: T[];
  undoRecords: T[];
};
class RecordStackFactory<T>
  extends JsonSerializableFactoryBase<RecordStackData<T>, RecordStack<T>> {
  fromJsonData<T>(data: RecordStackData<T>): RecordStack<T> {
    const stack = new RecordStack<T>();
    stack.records.elements = data.records;
    stack.undoRecords.elements = data.undoRecords;
    return stack;
  }
}
export const recordStackFactory: RecordStackFactory<unknown> = new RecordStackFactory();
/**
 * A data structure that maintain two stacks for general `undo` / `redo` functionality.
 */
export class RecordStack<T>
  extends JsonSerializableBase<RecordStackData<T>, RecordStackFactory<T>> {
  records: Stack<T> = new Stack<T>();
  undoRecords: Stack<T> = new Stack<T>();

  get factory(): RecordStackFactory<T> {
    return recordStackFactory as RecordStackFactory<T>;
  }

  get size(): number {
    return this.records.size;
  }

  push(record: T): void {
    this.records.push(record);
  }
  undo(): T {
    if (this.records.isEmpty) {
      throw Error("no record to undo");
    }
    const poped = this.records.pop();
    this.undoRecords.push(poped);
    return shallowCopy(poped);
  }
  redo(): T {
    if (this.undoRecords.isEmpty) {
      throw Error("no record to undo");
    }
    const poped = this.undoRecords.pop();
    this.records.push(poped);
    return shallowCopy(poped);
  }
  clear(): void {
    this.records.clear();
    this.undoRecords.clear();
  }
  clearRedo(): void {
    this.undoRecords.clear();
  }

  toJsonData(): RecordStackData<T> {
    return {
      records: this.records.toJsonData(),
      undoRecords: this.undoRecords.toJsonData(),
    };
  }
  echo(): void {
    console.log(this.toJsonData());
  }
}
