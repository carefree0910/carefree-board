import type { COps } from "./types.ts";
import type { AOpDataField, AOps } from "../aop.ts";
import type { IWorld } from "../../../world.ts";

import { AOpExecuter } from "../aop.ts";
import { RecordStack } from "../../../toolkit.ts";
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
 */
export class COpExecuter {
  private aopExecuter: AOpExecuter = new AOpExecuter();
  private records: RecordStack<AOps[]> = new RecordStack();

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
  exec(op: COps): Promise<void> {
    const aops = this.getAOps(op);
    this.records.clearRedo();
    this.records.push(aops);
    return this.stream(aops, "next");
  }
  /**
   * Undo the last `cop`.
   */
  undo(): Promise<void> {
    const aops = [...this.records.undo()];
    return this.stream(aops.reverse(), "prev");
  }
  /**
   * Redo the last `cop`.
   */
  redo(): Promise<void> {
    const aops = this.records.redo();
    return this.stream(aops, "next");
  }
  private async stream(aops: AOps[], field: AOpDataField): Promise<void> {
    for (const aop of aops) {
      await this.aopExecuter.exec(aop, field);
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
