import type { Dictionary } from "../../../toolkit.ts";
import type { INodeR } from "../../../nodes.ts";
import type { RenderInfo } from "../../../renderer.ts";

/**
 * Interface of the data within an {@link AssignmentAOp}.
 */
export interface AssignmentData {
  x?: INodeR["x"];
  y?: INodeR["y"];
  position?: INodeR["position"]["plain"];
}
/**
 * Fields of the `AssignmentData`.
 */
export type AssignmentFields = keyof AssignmentData;
/**
 * An `aop` that assigns a value to an {@link INodeR} directly.
 *
 * See {@link ExecuterPlugin} for the overall design of `op`s.
 */
export interface AssignmentAOp {
  /**
   * The type of this `aop`.
   */
  type: "assignment";
  /**
   * The previous status of this `aop`, used for `undo`.
   *
   * The keys of the dictionary are the `alias` of the `node`s, and the values are
   * the previous status.
   */
  prev: Dictionary<AssignmentData>;
  /**
   * The next status of this `aop`, used for `execution` and `redo`.
   *
   * The keys of the dictionary are the `alias` of the `node`s, and the values are
   * the next status.
   */
  next: Dictionary<AssignmentData>;
  /**
   * The `RenderInfo` caused by this `aop`.
   *
   * The keys of the dictionary are the `alias` of the `node`s, and the values are
   * the `RenderInfo`.
   */
  renderInfo: Dictionary<RenderInfo>;
}
/**
 * The exhaustive list of `aop`s.
 *
 * See {@link ExecuterPlugin} for the overall design of `op`s.
 */
export type AOps = AssignmentAOp;
