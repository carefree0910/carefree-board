import type { ISingleNode } from "./base.ts";
import type { IRectangleParams } from "./shape.ts";

export interface IImageParams extends IRectangleParams {
  url: string;
}

/**
 * Image node interface.
 *
 * ## `CONTENT_DIRTY`
 *
 * This node can be marked as `CONTENT_DIRTY` if only part of the following fields in
 * `params` are changed:
 *
 * - `radius`
 * - `visible`
 *
 * See {@link DirtyStatus} for context.
 */
export interface IImageNode extends ISingleNode {
  type: "image";
  params: IImageParams;
}
