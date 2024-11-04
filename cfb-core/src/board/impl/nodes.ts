import type { IBoardNode } from "../types.ts";
import type { ISingleNodeR } from "../../nodes.ts";
import type { IGraphSingleNode } from "../../graph.ts";
import type { IRenderer } from "../../renderer.ts";

import { DirtyStatus } from "../types.ts";

/**
 * A simple abstract implementation of {@link IBoardNode}.
 *
 * It uses a protected field `dirtyStatus` to store the dirty status, and leaves
 * the rendering logic to the subclasses.
 */
export abstract class BoardNodeBase<T extends ISingleNodeR> implements IBoardNode<T> {
  /**
   * The inner graph node.
   * > Since only `single` nodes are renderable, it will always be `IGraphSingleNode`.
   */
  gnode: IGraphSingleNode<T>;
  /**
   * The dirty status of the node.
   */
  protected dirtyStatus: DirtyStatus = DirtyStatus.CLEAN;

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
   * Get the `DirtyStatus` of the current {@link IBoardNode}.
   */
  getDirtyStatus(): DirtyStatus {
    return this.dirtyStatus;
  }
  /**
   * Set the `DirtyStatus` of the current {@link IBoardNode}.
   *
   * @param status The new dirty status.
   */
  setDirtyStatus(status: DirtyStatus): void {
    this.dirtyStatus = status;
  }

  /**
   * Initialize the current {@link IBoardNode} with the given `IRenderer`.
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
const BNODE_REGISTRATIONS: Map<string, Function> = new Map();

type Constructor<T extends ISingleNodeR> = new (
  node: IGraphSingleNode<T>,
) => IBoardNode<T>;

/**
 * Register a 'concrete' board node implementation.
 *
 * A typical workflow of implementing a board node is:
 *
 * 1. Define a class that extends `BoardNodeBase` and implements `IBoardNode`.
 * 2. Implement the rendering methods.
 * 3. Call this function to register the class at the end of the file.
 *
 * @param type The type of the node.
 * @param ctor The class itself.
 */
export function registerBoardNode<T extends ISingleNodeR>(
  type: T["type"],
  ctor: Constructor<T>,
): void {
  BNODE_REGISTRATIONS.set(type, ctor);
}
/**
 * Construct a board node from a graph node.
 *
 * > Normally this will not be used directly, because the `Board` class will call
 * > this function to construct all board nodes.
 *
 * @param gnode The graph node.
 * @returns The constructed board node.
 */
export function getBoardNode<T extends ISingleNodeR>(
  gnode: IGraphSingleNode<T>,
): IBoardNode<T> {
  const type = gnode.node.type;
  const ctor = BNODE_REGISTRATIONS.get(type) as Constructor<T> | undefined;
  if (!ctor) {
    throw new Error(`No board node registered for type '${type}'`);
  }
  return new ctor(gnode);
}
