import type { COps } from "./cop.ts";
import type { IPlugin } from "../types.ts";
import type { IWorld } from "../../world.ts";

import { COpExecuter } from "./cop.ts";

/**
 * The target of an `executer` plugin is to provide `undo` / `redo` functionality.
 *
 * To achieve this, this plugin will define a set of 'undoable' / 'redoable' `op`s
 * (operations), so downstream layers can use them to record snapshots.
 *
 * The `op`s are divided into two categories:
 *
 * 1. '**atomic**' `op`s (`aop`s): these `op`s are designed to be 'atomic', and `undo`
 *    / `redo` logics are implemented within them (see {@link AOpExecuter}).
 * > `aop`s should only be used in `cop`s.
 * 2. '**composite**' `op`s (`cop`s): these `op`s are composed by multiple 'atomic' `op`s,
 *    and do not need to implement `undo` / `redo` logics thanks to a global handling
 *    mechanism (see {@link COpExecuter}).
 * > `cop`s are the APIs that should be used by the downstream layers.
 *
 * With this design, the `undo` / `redo` logic is limited to the `aop`s, hence reducing
 * the complexity of the whole system.
 */
export class ExecuterPlugin implements IPlugin {
  /**
   * The executer that handles `cop`s.
   */
  copExecuter: COpExecuter = new COpExecuter();

  /**
   * Execute a `cop`.
   *
   * @param op The `cop` to execute.
   */
  exec(op: COps): void {
    this.copExecuter.exec(op);
  }
  /**
   * Undo the last `cop`.
   */
  undo(): void {
    this.copExecuter.undo();
  }
  /**
   * Redo the last `cop`.
   */
  redo(): void {
    this.copExecuter.redo();
  }

  /**
   * Bind the {@link COpExecuter} to the `world`.
   *
   * @param world The `world` instance.
   */
  start(world: IWorld): Promise<void> {
    this.copExecuter.bind(world);
    return Promise.resolve();
  }
  /**
   * Placeholder.
   */
  refresh(): void {}
}
