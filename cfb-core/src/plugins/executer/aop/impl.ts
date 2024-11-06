import type { AOps, AssignmentFields } from "./types.ts";
import type { IWorld } from "../../../world.ts";

import { isUndefined } from "../../../toolkit.ts";

/**
 * Data field of an {@link AOps}.
 */
export type AOpDataField = "prev" | "next";
/**
 * The `aop` executer.
 *
 * This class focuses on executing `aop`s and need not worry about maintaining
 * the history of the `aop`s.
 *
 * {@link COpExecuter}, which handles the history, is based on this class.
 */
export class AOpExecuter {
  private _world?: IWorld;

  /**
   * The binded `world`.
   */
  get world(): IWorld {
    if (isUndefined(this._world)) {
      throw Error("world is not set");
    }
    return this._world;
  }
  /**
   * Binds the `world` to this executer.
   *
   * @param world The `world` to bind.
   */
  bind(world: IWorld): void {
    this._world = world;
  }
  /**
   * Executes an `aop`.
   *
   * @param op The `aop` to execute.
   * @param field The data field to execute.
   * - `prev`: happens at `undo`.
   * - `next`: happens at `execution` / `redo`.
   */
  exec(op: AOps, field: AOpDataField): Promise<void> {
    switch (op.type) {
      case "assignment":
        return this.execAssignment(op, field);
    }
  }

  private execAssignment(op: AOps, field: AOpDataField): Promise<void> {
    const data = op[field];
    for (const [alias, assignment] of Object.entries(data)) {
      const rnode = this.world.getRNode(alias);
      for (const [field, value] of Object.entries(assignment)) {
        rnode.gnode.node[field as AssignmentFields] = value;
      }
      rnode.setDirtyStatus(op.dirtyStatus[alias]);
    }
    return Promise.resolve();
  }
}
