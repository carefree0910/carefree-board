import type { AssignmentData } from "../aop.ts";
import type { Dictionary } from "../../../toolkit.ts";

/**
 * Type of `cop`s that simply utilize {@link IAssignmentAOp} `aop`.
 *
 * See {@link ExecuterPlugin} for the overall design of `op`s.
 */
export type AssignmentCOpsType = "move" | "moveTo";
/**
 * Data of `cop`s that simply utilize {@link IAssignmentAOp} `aop`.
 *
 * See {@link ExecuterPlugin} for the overall design of `op`s.
 */
export type AssingmentData = Record<AssignmentCOpsType, Dictionary<AssignmentData>>;

/**
 * `cop`s that simply utilize {@link IAssignmentAOp} `aop`.
 *
 * See {@link ExecuterPlugin} for the overall design of `op`s.
 */
export interface AssignmentCOp<T extends AssignmentCOpsType> {
  type: T;
  prev: Dictionary<AssignmentData>;
  next: Dictionary<AssignmentData>;
}

/**
 * The exhaustive list of `cop`s.
 *
 * See {@link ExecuterPlugin} for the overall design of `op`s.
 */
export type COps = AssignmentCOp<AssignmentCOpsType>;
