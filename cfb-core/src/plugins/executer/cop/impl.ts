import type { COps } from "./types.ts";
import type { AOpDataField, AOps } from "../aop.ts";
import type { IWorld } from "../../../world.ts";

import { AOpExecuter } from "../aop.ts";
import { AsyncQueue, RecordStack } from "../../../toolkit.ts";
import { DirtyStatus } from "../../../board.ts";

/**
 * The `cop` executer.
 *
 * This class is responsible for executing `cop`s, its workflow is basically as follows:
 *
 * 1. Get the corresponding `aop`s from the `cop`.
 * 2. Push the `aop`s to the `records`, then execute them with {@link AOpExecuter}.
 * 3. When `undo` is called, pop `aop`s from `records` and execute them in reverse order.
 * 4. When `redo` is called, pop `aop`s from `records` and execute them in order.
 *
 * Since `undo` / `redo` is often triggered by user interactions, they are implemented
 * with an `AsyncQueue` to ensure that:
 *
 * 1. The operations are executed in order.
 * 2. The exposed APIs are synchronous and no need to await.
 */
export class COpExecuter {
  private aopExecuter: AOpExecuter = new AOpExecuter();
  private records: RecordStack<AOps[]> = new RecordStack();
  private queue = new AsyncQueue({
    fn: (data: { aop: AOps; field: AOpDataField; refresh: boolean }) =>
      this.aopExecuter.exec(data.aop, data.field).then(() => {
        if (data.refresh) {
          this.aopExecuter.world.renderer.refresh();
        }
      }),
  });

  /**
   * Bind the `world` to the executer.
   *
   * @param world The world to bind.
   */
  bind(world: IWorld): void {
    this.aopExecuter.bind(world);
  }
  /**
   * Execute the `cop`.
   *
   * @param op The `cop` to execute.
   */
  exec(op: COps): void {
    const aops = this.getAOps(op);
    this.records.clearRedo();
    this.records.push(aops);
    this.stream(aops, "next");
  }
  /**
   * Undo the last `cop`.
   */
  undo(): void {
    const aops = [...this.records.undo()];
    this.stream(aops.reverse(), "prev");
  }
  /**
   * Check if `undo` is available.
   */
  canUndo(): boolean {
    return !this.records.records.isEmpty;
  }
  /**
   * Redo the last `cop`.
   */
  redo(): void {
    const aops = this.records.redo();
    this.stream(aops, "next");
  }
  /**
   * Check if `redo` is available.
   */
  canRedo(): boolean {
    return !this.records.undoRecords.isEmpty;
  }
  private stream(aops: AOps[], field: AOpDataField): void {
    for (let i = 0; i < aops.length; i++) {
      this.queue.push({ aop: aops[i], field, refresh: i === aops.length - 1 });
    }
  }

  private getAOps(cop: COps): AOps[] {
    switch (cop.type) {
      case "move":
      case "moveTo":
        return this.getAssignmentAOps(cop);
    }
  }
  private getAssignmentAOps(cop: COps): AOps[] {
    const aop: AOps = {
      type: "assignment",
      prev: {},
      next: {},
      dirtyStatus: {},
    };
    for (const [alias, prev] of Object.entries(cop.prev)) {
      const next = cop.next[alias];
      aop.prev[alias] = prev;
      aop.next[alias] = next;
      aop.dirtyStatus[alias] = DirtyStatus.TRANSFORM_DIRTY;
    }
    return [aop];
  }
}
