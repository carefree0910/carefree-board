import type { ISingleNodeR } from "../../nodes.ts";
import type { IGraphSingleNode } from "../../graph.ts";
import type { IRenderer } from "../../renderer.ts";

/**
 * Node dirty status.
 */
export enum DirtyStatus {
  /**
   * Current node is clean, no need to update.
   */
  CLEAN,
  /**
   * Current node's transformation matrix is dirty, need to update the transformation.
   * > This is treated as a 'fast path' for updating the node, because as far as I
   * > know, almost every renderer can update transformation matrix pretty fast, so
   * > `TRANSFORM_DIRTY` is safe to be marked anytime.
   */
  TRANSFORM_DIRTY,
  /**
   * Current node's (unbreaking) contents are dirty.
   * > This means that the node's 'type' is not changed, only the content is changed,
   * > and the changes are not breaking (e.g., changing the corner radius of a 'rect'
   * > / the filters of an 'image').
   * >
   * > So this is expected to be pretty fast, and should be comfortable to call in
   * > real-time. This means whether the node can be marked as `CONTENT_DIRTY` or not
   * > **HEAVILY** depends on the concrete implementation of your renderer, because
   * > different renderers may prefer different render patterns.
   */
  CONTENT_DIRTY,
  /**
   * Current node is completely dirty, need to re-render the whole node.
   * > This is triggered if:
   * >
   * > 1. The node's 'type' is changed (e.g., from 'rect' to 'image').
   * > 2. The node's 'content' is changed, and the changes are breaking (e.g., the
   * > `src` of an 'image' is changed).
   * >
   * > So this is expected to be quite slow, and should be avoided if possible. But
   * > on the other hand, this is the safest to be called if performance is not a
   * > concern, because it will always work.
   */
  ALL_DIRTY,
}

/**
 * Board node interface.
 *
 * A 'work cycle' of a board node is basically as follows:
 *
 * 1. Initialized with the `initialize` method.
 * 2. Some interactions happened in the `world` and:
 *    1. The inner `gnode` is updated.
 *    2. The dirty status is set to corresponding value.
 * 3. The `updateTransform` / `updateContent` / `reRender` method will be triggered by
 *    the `world`, depending on the dirty status.
 * 4. Back to step 2.
 *
 * So inside the board node, you don't need to worry about what happened in the
 * `world`, you just need to focus on the rendering logic.
 *
 * > See {@link BoardNodeBase}, which is a simple abstract implementation of this interface.
 */
export interface IBoardNode<T extends ISingleNodeR = ISingleNodeR> {
  /**
   * The inner graph node.
   * > Since only `single` nodes are renderable, it will always be `IGraphSingleNode`.
   */
  gnode: IGraphSingleNode<T>;

  /**
   * The `alias` of the inner {@link ISingleNodeR}.
   */
  get alias(): string;

  /**
   * Get the `DirtyStatus` of the current {@link IBoardNode}.
   */
  getDirtyStatus(): DirtyStatus;
  /**
   * Set the `DirtyStatus` of the current {@link IBoardNode}.
   * @param status The new dirty status.
   */
  setDirtyStatus(status: DirtyStatus): void;
  /**
   * Initialize the current {@link IBoardNode} with the given `IRenderer`.
   */
  initialize(renderer: IRenderer): Promise<void>;
  /**
   * Will be triggered when {@link DirtyStatus} is `TRANSFORM_DIRTY`.
   * > You don't need to check the dirty status here as it will be handled by the caller.
   */
  updateTransform(renderer: IRenderer): Promise<void>;
  /**
   * Will be triggered when {@link DirtyStatus} is `CONTENT_DIRTY`.
   * > You don't need to check the dirty status here as it will be handled by the caller.
   */
  updateContent(renderer: IRenderer): Promise<void>;
  /**
   * Will be triggered when {@link DirtyStatus} is `ALL_DIRTY`.
   * > You don't need to check the dirty status here as it will be handled by the caller.
   */
  reRender(renderer: IRenderer): Promise<void>;
}
