import type { ISingleNodeR } from "../../nodes.ts";
import type { IGraphSingleNode } from "../../graph.ts";
import type { IRenderer } from "../../renderer.ts";

/**
 * Node dirty status.
 *
 * @member CLEAN Current node is clean, no need to update.
 * @member TRANSFORM_DIRTY Current node's transformation matrix is dirty, need to update the transformation.
 * > this is treated as a 'fast path' for updating the node, because as far as I know, almost every renderer
 * > can update transformation matrix pretty fast, so `TRANSFORM_DIRTY` is safe to be marked anytime.
 * @member CONTENT_DIRTY Current node's (unbreaking) contents are dirty.
 * > this means that the node's 'type' is not changed, only the content is changed, and the changes are
 * > not breaking (e.g., changing the corner radius of a 'rect' / the filters of an 'image').
 * >
 * > so this is expected to be pretty fast, and should be comfortable to call in real-time. this means
 * > whether the node can be marked as `CONTENT_DIRTY` or not **HEAVILY** depends on the concrete implementation
 * > of your renderer, because different renderers may prefer different render patterns.
 * @member ALL_DIRTY Current node is completely dirty, need to re-render the whole node.
 * > this is triggered if:
 * >
 * > 1. the node's 'type' is changed (e.g., from 'rect' to 'image').
 * > 2. the node's 'content' is changed, and the changes are breaking (e.g., the `src` of an 'image' is changed).
 * >
 * > so this is expected to be quite slow, and should be avoided if possible. but on the other hand, this is the
 * > safest to be called if performance is not a concern, because it will always work.
 */
export enum DirtyStatus {
  CLEAN,
  TRANSFORM_DIRTY,
  CONTENT_DIRTY,
  ALL_DIRTY,
}

/**
 * Board node interface.
 *
 * A 'work cycle' of a board node is basically as follows:
 *
 * 1. Initialized with the `initialize` method.
 * 2. Some interactions happened in the 'world' and:
 *   i. the inner `gnode` is updated.
 *   ii. the dirty status is set to corresponding value.
 * 3. The `updateTransform` / `reRender` method will be triggered by the 'world', depending on the dirty status.
 * 4. Back to step 2.
 *
 * So, inside the board node, you don't need to worry about what happened in the 'world', you just need to focus on the rendering logic.
 *
 * @param gnode The inner graph node. Since only `single` nodes are renderable, it will always be `IGraphSingleNode`.
 *
 * @method getDirtyStatus Get the dirty status of the node.
 * @method setDirtyStatus Set the dirty status of the node.
 * @method initialize Will be triggered at initialization.
 * @method updateTransform Will be triggered when the 'dirty status' is `TRANSFORM_DIRTY`.
 * > You don't need to check the dirty status here as it will be handled by the caller.
 * @method updateContent Will be triggered when the 'dirty status' is `CONTENT_DIRTY`.
 * > You don't need to check the dirty status here as it will be handled by the caller.
 * @method reRender Will be triggered when the 'dirty status' is `ALL_DIRTY`.
 * > You don't need to check the dirty status here as it will be handled by the caller.
 */
export interface IBoardNode<T extends ISingleNodeR = ISingleNodeR> {
  gnode: IGraphSingleNode<T>;

  get alias(): string;

  getDirtyStatus(): DirtyStatus;
  setDirtyStatus(status: DirtyStatus): void;
  initialize(renderer: IRenderer): Promise<void>;
  updateTransform(renderer: IRenderer): Promise<void>;
  updateContent(renderer: IRenderer): Promise<void>;
  reRender(renderer: IRenderer): Promise<void>;
}
