import type { IRenderer } from "./renderer.ts";
import type { ISingleNodeR } from "../../nodes.ts";
import type { IGraphSingleNode } from "../../graph.ts";

/**
 * Node dirty status.
 *
 * Notice that the order of the enum values is important - we will treat the smaller
 * value as a 'sub-dirtiness' of the larger value, which means the rendering process
 * of the larger value will include the rendering process of the smaller value.
 *
 * In this case, it is safe to drop previous dirty status if a larger dirty status is
 * set afterward. This can be used to optimize the renderer.
 *
 * See {@link isSubRenderInfo} & {@link Renderer} for a concrete example.
 */
export enum DirtyStatus {
  /**
   * Current node is clean, no need to update.
   */
  CLEAN,
  /**
   * Current node's transformation matrix is dirty, need to update the transformation.
   *
   * This is treated as a 'fast path' for updating the node, because as far as I
   * know, almost every renderer can update transformation matrix pretty fast, so
   * `TRANSFORM_DIRTY` is safe to be marked anytime.
   */
  TRANSFORM_DIRTY,
  /**
   * Current node's (unbreaking) contents are dirty.
   *
   * This means that the node's 'type' is not changed, only the content is changed,
   * and the changes are not breaking (e.g., changing the corner radius of a 'rect'
   * / the filters of an 'image').
   *
   * So this is expected to be pretty fast, and should be relatively comfortable to
   * call frequently. This means whether the node can be marked as `CONTENT_DIRTY`
   * or not **HEAVILY** depends on the concrete implementation of your renderer,
   * because different renderers may prefer different render patterns.
   *
   * We will provide renderer-agnostic documentations on each {@link ISingleNodeR}
   * to 'suggest' when to mark the node as `CONTENT_DIRTY` (see {@link IRectangleNode}
   * for example), and downstream renderers may follow the suggestions to optimize the
   * corresponding render process. This is not forced, but will make your renderer more
   * adaptable to the ecosystem of `cfb`.
   *
   * Anyway, if you are not sure, just mark the node as `ALL_DIRTY` - it will always work.
   */
  CONTENT_DIRTY,
  /**
   * Current node is completely dirty, need to re-render the whole node.
   * This is triggered if:
   *
   * 1. The node's 'type' is changed (e.g., from 'rect' to 'image').
   * 2. The node's 'content' is changed, and the changes are breaking (e.g., the
   * url of an `image` is changed, or the content of a `text` is changed).
   *
   * So this is expected to be quite slow, and should be avoided if possible. But
   * on the other hand, this is the safest to be called if performance is not a
   * concern, because it will always work.
   */
  ALL_DIRTY,
}

/**
 * The target queue that the render process should be put into.
 */
export enum TargetQueue {
  /**
   * Don't need to render, corresponding to the `CLEAN` value of {@link DirtyStatus}.
   *
   * > Notice that it is considered as an error, if a node is put into the `EMPTY` queue,
   * > but its {@link DirtyStatus} is not `CLEAN`.
   */
  EMPTY,
  /**
   * Render immediately.
   *
   * Processes that are either fast or need to be rendered before further interactions
   * should be put into this queue. Typical use cases:
   *
   * 1. Update the transformation matrix.
   * 2. Update the corner radius / filters.
   *
   * > Notice that this is renderer-dependent, because different renderers may have
   * > different performance characteristics.
   */
  IMMEDIATE,
  /**
   * Offload the rendering.
   *
   * Processes that are slow or can be delayed should be put into this queue, so they
   * will not block the `IMMEDIATE` queue. Typical use cases:
   *
   * 1. Update the url of an image.
   * 2. Update the font of a text.
   *
   * > Notice that this is renderer-dependent, because different renderers may have
   * > different performance characteristics.
   */
  OFFLOAD,
}

/**
 * The necessary information to render the graph.
 */
export type RenderInfo = {
  dirtyStatus: DirtyStatus;
  targetQueue: TargetQueue;
};
/**
 * A map that maps the alias of a node to its `RenderInfo`.
 */
export type RenderInfoMap = Map<string, RenderInfo>;
/**
 * An 'idle' `RenderInfo`.
 */
export const idleRenderInfo: RenderInfo = {
  dirtyStatus: DirtyStatus.CLEAN,
  targetQueue: TargetQueue.EMPTY,
};

/**
 * Render node interface.
 *
 * A 'work cycle' of a render node is basically as follows:
 *
 * 1. Initialized with the `initialize` method.
 * 2. Some interactions happened in the `world` and:
 *    1. The inner `gnode` is updated.
 *    2. The dirty status is set to corresponding value.
 * 3. The `updateTransform` / `updateContent` / `reRender` method will be triggered by
 *    the `world`, depending on the dirty status.
 * 4. Back to step 2.
 *
 * So inside the render node, you don't need to worry about what happened in the
 * `world`, you just need to focus on the rendering logic.
 *
 * > See {@link RenderNodeBase}, which is a simple abstract implementation of this interface.
 */
export interface IRenderNode<T extends ISingleNodeR = ISingleNodeR> {
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
   * Get the `RenderInfo` of the current {@link IRenderNode}.
   */
  getRenderInfo(): RenderInfo;
  /**
   * Set the `RenderInfo` of the current {@link IRenderNode}.
   *
   * @param status The new dirty status.
   */
  setRenderInfo(status: RenderInfo): void;
  /**
   * Initialize the current {@link IRenderNode} with the given `IRenderer`.
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
