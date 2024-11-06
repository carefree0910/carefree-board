import type { IRenderer, IRenderNode, RenderInfo } from "../types.ts";
import type { ISingleNodeR } from "../../nodes.ts";
import type { IGraphSingleNode } from "../../graph.ts";

import { idleRenderInfo } from "../types.ts";

/**
 * A simple abstract implementation of {@link IRenderNode}.
 *
 * It uses a protected field `renderInfo` to store the {@link RenderInfo}, and leaves
 * the rendering logic to the subclasses.
 */
export abstract class RenderNodeBase<T extends ISingleNodeR> implements IRenderNode<T> {
  /**
   * The graph node to render.
   * > Since only `single` nodes are renderable, it will always be `IGraphSingleNode`.
   */
  gnode: IGraphSingleNode<T>;
  /**
   * The render info of the node.
   */
  protected renderInfo: RenderInfo = idleRenderInfo;

  constructor(gnode: IGraphSingleNode<T>) {
    this.gnode = gnode;
  }

  /**
   * The `alias` of the inner {@link ISingleNodeR}.
   */
  get alias(): string {
    return this.gnode.node.alias;
  }

  /**
   * Get the `RenderInfo` of the current {@link IRenderNode}.
   */
  getRenderInfo(): RenderInfo {
    return this.renderInfo;
  }
  /**
   * Set the `RenderInfo` of the current {@link IRenderNode}.
   */
  setRenderInfo(renderInfo: RenderInfo): void {
    this.renderInfo = renderInfo;
  }

  /**
   * Initialize the current {@link IRenderNode} with the given `IRenderer`.
   */
  abstract initialize(renderer: IRenderer): Promise<void>;
  /**
   * Will be triggered when {@link DirtyStatus} is `TRANSFORM_DIRTY`.
   * > You don't need to check the dirty status here as it will be handled by the caller.
   */
  abstract updateTransform(renderer: IRenderer): Promise<void>;
  /**
   * Will be triggered when {@link DirtyStatus} is `CONTENT_DIRTY`.
   * > You don't need to check the dirty status here as it will be handled by the caller.
   */
  abstract updateContent(renderer: IRenderer): Promise<void>;
  /**
   * Will be triggered when {@link DirtyStatus} is `ALL_DIRTY`.
   * > You don't need to check the dirty status here as it will be handled by the caller.
   */
  abstract reRender(renderer: IRenderer): Promise<void>;
}

// we keep this 'original' `Map` generic, because it is not public, and we can
// ensure type-safety from the APIs.
// deno-lint-ignore ban-types
const RNODE_REGISTRATIONS: Map<string, Function> = new Map();

type Constructor<T extends ISingleNodeR> = new (
  node: IGraphSingleNode<T>,
) => IRenderNode<T>;

/**
 * Register a 'concrete' render node implementation.
 *
 * A typical workflow of implementing a render node is:
 *
 * 1. Define a class that extends `RenderNodeBase` and implements `IRenderNode`.
 * 2. Implement the rendering methods.
 * 3. Call this function to register the class at the end of the file.
 *
 * @param type The type of the node.
 * @param ctor The class itself.
 */
export function registerRenderNode<T extends ISingleNodeR>(
  type: T["type"],
  ctor: Constructor<T>,
): void {
  RNODE_REGISTRATIONS.set(type, ctor);
}
/**
 * Construct a render node from a graph node.
 *
 * > Normally this will not be used directly, because the {@link Renderer} class will
 * > call this function to construct all render nodes.
 *
 * @param gnode The graph node.
 * @returns The constructed render node.
 */
export function getRenderNode<T extends ISingleNodeR>(
  gnode: IGraphSingleNode<T>,
): IRenderNode<T> {
  const type = gnode.node.type;
  const ctor = RNODE_REGISTRATIONS.get(type) as Constructor<T> | undefined;
  if (!ctor) {
    throw new Error(`No render node registered for type '${type}'`);
  }
  return new ctor(gnode);
}
