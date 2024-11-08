import type { IRenderer, IRenderNode, RenderInfoMap } from "../types.ts";
import type { IGroupNodeR, ISingleNodeR } from "../../nodes.ts";
import type { IGraph } from "../../graph.ts";

import { getRenderNode } from "./node.ts";
import { DirtyStatus, idleRenderInfo, TargetQueue } from "../types.ts";
import { AsyncQueue, isUndefined } from "../../toolkit.ts";

/**
 * Check if the `prev` render info is a subset of the `next` render info.
 *
 * The correctness of this function relies on the semantic contract of the
 * {@link DirtyStatus} enum - in short, smaller values are considered as subsets
 * of larger values.
 *
 * @param prev The previous render info.
 * @param next The next render info.
 * @returns `true` if the `prev` render info is a subset of the `next` render info. In
 * this case, we can safely discard the `prev` render info and only render the `next`.
 */
export function isSubRenderInfo(prev: RenderInfoMap, next: RenderInfoMap): boolean {
  if (prev.size > next.size) {
    return false;
  }
  for (const [alias, prevInfo] of prev.entries()) {
    const nextInfo = next.get(alias);
    if (!nextInfo || prevInfo.dirtyStatus > nextInfo.dirtyStatus) {
      return false;
    }
  }
  return true;
}
/**
 * A basic implementation of the {@link IRenderer} interface, it uses an async queue to
 * manage the rendering process.
 *
 * The render queue utilizes the {@link isSubRenderInfo} function to determine if
 * an incoming render request can replace the current one, which relies on the semantic
 * contract of the {@link DirtyStatus} enum.
 *
 * > Notice that it's a common pratice to extend this class and add more
 * > information at downstream applications.
 */
export class Renderer implements IRenderer {
  /**
   * The graph to render.
   */
  graph: IGraph;

  private queue: AsyncQueue<RenderInfoMap>;
  private offloadQueue: AsyncQueue<RenderInfoMap>;
  private rnodes: IRenderNode[];
  private nodeMapping: Map<string, IRenderNode>;

  constructor(graph: IGraph) {
    this.graph = graph;
    this.queue = new AsyncQueue({
      fn: this.render.bind(this),
      replacable: true,
      replacableCondition: isSubRenderInfo,
    });
    this.offloadQueue = new AsyncQueue({
      fn: this.render.bind(this),
      replacable: true,
      replacableCondition: isSubRenderInfo,
    });
    this.rnodes = [];
    this.nodeMapping = new Map();
    for (const node of graph.allSingleNodes) {
      const rnode = getRenderNode(node);
      this.rnodes.push(rnode);
      this.nodeMapping.set(node.node.alias, rnode);
    }
  }

  /**
   * All nodes in the renderer.
   */
  get allNodes(): IRenderNode[] {
    return this.rnodes;
  }

  /**
   * Add an `ISingleNodeR` to the renderer.
   *
   * @param node The node to add, it should be a `single` node because only
   * `single` nodes are renderable.
   * @param parent The alias of the parent node, if any.
   */
  add(node: ISingleNodeR, parent?: string): void {
    if (this.nodeMapping.has(node.alias)) {
      throw new Error(`Node with alias ${node.alias} already exists`);
    }
    const parentNode = isUndefined(parent)
      ? undefined
      : this.graph.tryGet<IGroupNodeR>(parent)?.node;
    if (!isUndefined(parent) && !parentNode) {
      throw new Error(`Parent with alias ${parent} does not exist`);
    }
    const gnode = this.graph.add<ISingleNodeR>(node, parentNode);
    const rnode = getRenderNode(gnode);
    this.rnodes.push(rnode);
    this.nodeMapping.set(gnode.node.alias, rnode);
  }

  /**
   * Get an {@link IRenderNode} by its alias, throw an error if not found.
   *
   * @param alias The alias of the node to get.
   */
  get(alias: string): IRenderNode {
    const rnode = this.tryGet(alias);
    if (!rnode) {
      throw new Error(`Node with alias ${alias} does not exist`);
    }
    return rnode;
  }
  /**
   * Try to get an `IRenderNode` by its alias, return `undefined` if not found.
   *
   * @param alias The alias of the node to get.
   */
  tryGet(alias: string): IRenderNode | undefined {
    return this.nodeMapping.get(alias);
  }

  /**
   * Update an existing {@link IRenderNode} with a new `ISingleNodeR`.
   *
   * @param alias The alias of the node to update.
   * @param node The new node to update with.
   */
  update(alias: string, node: ISingleNodeR): void {
    this.delete(alias);
    this.add(node);
  }

  /**
   * Delete an {@link IRenderNode} by its alias, throw an error if not found.
   *
   * @param alias The alias of the node to delete.
   */
  delete(alias: string): void {
    const rnode = this.nodeMapping.get(alias);
    if (!rnode) {
      throw new Error(`Node with alias ${alias} does not exist`);
    }
    this.rnodes = this.rnodes.filter((n) => n !== rnode);
    this.nodeMapping.delete(alias);
  }

  async start(): Promise<void> {
    const promises = this.allNodes.map((rnode) => rnode.initialize(this));
    await Promise.all(promises);
  }

  refresh(): void {
    const immediateMap: RenderInfoMap = new Map();
    const offloadMap: RenderInfoMap = new Map();
    for (const rnode of this.allNodes) {
      const renderInfo = rnode.getRenderInfo();
      if (renderInfo.dirtyStatus !== DirtyStatus.CLEAN) {
        if (renderInfo.targetQueue === TargetQueue.IMMEDIATE) {
          immediateMap.set(rnode.alias, renderInfo);
        } else {
          offloadMap.set(rnode.alias, renderInfo);
        }
        rnode.setRenderInfo(idleRenderInfo);
      }
    }
    if (immediateMap.size > 0) {
      this.queue.push(immediateMap);
    }
    if (offloadMap.size > 0) {
      this.offloadQueue.push(offloadMap);
    }
  }

  wait(): Promise<void> {
    return this.queue.wait();
  }

  async render(renderInfoMap: RenderInfoMap): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const [alias, { dirtyStatus }] of renderInfoMap.entries()) {
      const rnode = this.tryGet(alias);
      if (!rnode) {
        console.warn(`[Renderer] Node is already removed: ${alias}`);
        continue;
      }
      switch (dirtyStatus) {
        case DirtyStatus.CLEAN:
          console.warn(`[Renderer] 'CLEAN' status is not expected: ${alias}`);
          break;
        case DirtyStatus.TRANSFORM_DIRTY:
          promises.push(rnode.updateTransform(this));
          break;
        case DirtyStatus.CONTENT_DIRTY:
          promises.push(rnode.updateContent(this));
          break;
        case DirtyStatus.ALL_DIRTY:
          promises.push(rnode.reRender(this));
          break;
      }
    }
    await Promise.all(promises);
  }
}
