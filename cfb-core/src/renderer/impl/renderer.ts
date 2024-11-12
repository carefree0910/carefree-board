import type { IRenderer, IRenderNode, RenderInfoMap } from "../types.ts";
import type { Point } from "../../toolkit.ts";
import type { ISingleNodeR } from "../../nodes.ts";
import type { IGraph } from "../../graph.ts";

import { getRenderNode } from "./node.ts";
import { DirtyStatus, idleRenderInfo, TargetQueue } from "../types.ts";
import { AsyncQueue, Event, Matrix2D } from "../../toolkit.ts";

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
 * Event emitted by the `globalMove` method of {@link IRenderer}.
 *
 * > `data` represents the transform matrix after the move.
 */
export interface IGlobalMoveEvent {
  type: "globalMove";
  data: { globalTransform: Matrix2D };
}
/**
 * Event emitted by the `globalScale` method of {@link IRenderer}.
 *
 * > `data` represents the transform matrix after the scale.
 */
export interface IGlobalScaleEvent {
  type: "globalScale";
  data: { globalTransform: Matrix2D };
}
/**
 * Event emitted by the `setGlobalTransform` method of {@link IRenderer}.
 *
 * > `data` represents the transform matrix after the assignment.
 */
export interface IGlobalTransformEvent {
  type: "globalTransform";
  data: { globalTransform: Matrix2D };
}
export type IRendererEvent =
  | IGlobalMoveEvent
  | IGlobalScaleEvent
  | IGlobalTransformEvent;
type RendererEvent = Event<IRendererEvent>;
export const rendererEvent: RendererEvent = new Event();

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
  /**
   * The global transform matrix of the renderer.
   */
  globalTransform: Matrix2D;

  protected minScale = 0.02;
  protected maxScale = 256.0;

  private queue: AsyncQueue<RenderInfoMap>;
  private offloadQueue: AsyncQueue<RenderInfoMap>;
  private rnodes: IRenderNode[];
  private nodeMapping: Map<string, IRenderNode>;

  constructor(graph: IGraph) {
    this.graph = graph;
    this.globalTransform = Matrix2D.identity();
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
   * Add an existing `ISingleNodeR` in `graph` to the renderer.
   */
  add(alias: string): void {
    const gnode = this.graph.get<ISingleNodeR>(alias);
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
   * Delete an {@link IRenderNode} by its alias, throw an error if not found.
   *
   * > Notice that this will **NOT** remove the node from the `graph`.
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

  /**
   * Move the renderer 'globally' by a delta.
   */
  globalMove(delta: Point): void {
    this.globalTransform = this.globalTransform.move(delta);
    this.allNodes.forEach((rnode) =>
      rnode.setRenderInfo({
        dirtyStatus: DirtyStatus.TRANSFORM_DIRTY,
        targetQueue: TargetQueue.IMMEDIATE,
      })
    );
    this.refresh();
    rendererEvent.emit({
      type: "globalMove",
      data: { globalTransform: this.globalTransform.clone() },
    });
  }
  /**
   * Set the renderer 'globally' by a scale and a center point.
   */
  globalScale(scale: number, center: Point): void {
    const ts = Math.max(
      this.minScale,
      Math.min(this.maxScale, this.globalTransform.scaleX * scale),
    );
    this.globalTransform = this.globalTransform.scaleToWithCenter(ts, ts, center);
    this.allNodes.forEach((rnode) =>
      rnode.setRenderInfo({
        dirtyStatus: DirtyStatus.TRANSFORM_DIRTY,
        targetQueue: TargetQueue.IMMEDIATE,
      })
    );
    this.refresh();
    rendererEvent.emit({
      type: "globalScale",
      data: { globalTransform: this.globalTransform.clone() },
    });
  }
  /**
   * Set the renderer's global transform matrix directly.
   */
  setGlobalTransform(transform: Matrix2D): void {
    this.globalTransform = transform;
    this.allNodes.forEach((rnode) =>
      rnode.setRenderInfo({
        dirtyStatus: DirtyStatus.TRANSFORM_DIRTY,
        targetQueue: TargetQueue.IMMEDIATE,
      })
    );
    this.refresh();
    rendererEvent.emit({
      type: "globalTransform",
      data: { globalTransform: this.globalTransform.clone() },
    });
  }
  /**
   * Set the renderer's global transform matrix directly, without triggering a refresh.
   */
  setGlobalTransformData(transform: Matrix2D): void {
    this.globalTransform = transform;
  }

  private async render(renderInfoMap: RenderInfoMap): Promise<void> {
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
