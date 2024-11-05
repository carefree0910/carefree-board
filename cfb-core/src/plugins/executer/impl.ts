import type { COpRecord, COps } from "./cop.ts";
import type { IPlugin } from "../types.ts";
import type { IDispose } from "../../toolkit.ts";
import type { IWorld } from "../../world.ts";

import { COpExecuter } from "./cop.ts";
import { Event } from "../../toolkit.ts";

/**
 * Event emitted by the `exec` method of {@link ExecuterPlugin}.
 */
export interface IExecEvent {
  type: "exec";
  cop: COps;
}
/**
 * Event emitted by the `undo` method of {@link ExecuterPlugin}.
 */
export interface IUndoEvent {
  type: "undo";
  record: COpRecord;
}
/**
 * Event emitted by the `redo` method of {@link ExecuterPlugin}.
 */
export interface IRedoEvent {
  type: "redo";
  record: COpRecord;
}
/**
 * The event emitted by the `executer` plugin.
 */
export type IExecuterEvent = IExecEvent | IUndoEvent | IRedoEvent;
type ExecuterEvent = Event<IExecuterEvent>;
const executerEvent: ExecuterEvent = new Event();

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
   * Execute a `cop` and emit {@link IExecEvent}.
   */
  exec(op: COps): void {
    this.copExecuter.exec(op);
    executerEvent.emit({ type: "exec", cop: op });
  }
  /**
   * Undo the last `cop` and emit {@link IUndoEvent}.
   */
  undo(): void {
    const record = this.copExecuter.undo();
    executerEvent.emit({ type: "undo", record });
  }
  /**
   * Check if `undo` is available.
   */
  canUndo(): boolean {
    return this.copExecuter.canUndo();
  }
  /**
   * Redo the last `cop` and emit {@link IRedoEvent}.
   */
  redo(): void {
    const record = this.copExecuter.redo();
    executerEvent.emit({ type: "redo", record });
  }
  /**
   * Check if `redo` is available.
   */
  canRedo(): boolean {
    return this.copExecuter.canRedo();
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
}

/**
 * Register an event listener for the `executer` plugin.
 */
export function registerExecuterEvent(fn: (event: IExecuterEvent) => void): IDispose {
  return executerEvent.on(fn);
}
