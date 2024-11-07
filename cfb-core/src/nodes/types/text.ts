import type { INodeParamsBase, ISingleNode } from "./base.ts";

export const allTextAlign = ["left", "center", "right", "justify"] as const;
export type TextAlign = (typeof allTextAlign)[number];
export interface ITextParams extends INodeParamsBase {
  content: string;
  fontSize: number;
  font?: string;
  fontWeight?: string;
  align?: TextAlign;
  color?: string;
  opacity?: number;
  lineHeight?: number;
  autoFitContent?: boolean;
}

/**
 * Text node interface.
 *
 * ## `CONTENT_DIRTY`
 *
 * This node can be marked as `CONTENT_DIRTY` if only part of the following fields in
 * `params` are changed:
 *
 * - `content`
 * - `fontSize`
 * - `fontWeight`
 * - `align`
 * - `color`
 * - `opacity`
 * - `lineHeight`
 * - `autoFitContent`
 *
 * See {@link DirtyStatus} for context.
 */
export interface ITextNode extends ISingleNode {
  type: "text";
  params: ITextParams;
}
