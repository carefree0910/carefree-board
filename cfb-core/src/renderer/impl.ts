import type { IRenderer, IRenderInfo } from "./types.ts";
import type { IBoard } from "../board.ts";
import type { IWorld } from "../world.ts";

import { AsyncQueue } from "../toolkit.ts";
import { DirtyStatus } from "../board.ts";

/**
 * A basic implementation of the renderer, it uses an async queue to
 * manage the rendering process.
 *
 * > Notice that it's a common pratice to extend this class and add more
 * > information at downstream applications.
 */
export class Renderer implements IRenderer {
  board: IBoard;
  private _queue: AsyncQueue<IRenderInfo>;

  constructor(board: IBoard) {
    this.board = board;
    // the render queue is 'replacable', because each 'render' is a 'complete' update.
    this._queue = new AsyncQueue({
      fn: this.render.bind(this),
      replacable: true,
    });
  }

  initialize(_: IWorld): void {}

  async start(): Promise<void> {
    const promises = this.board.allNodes.map((bnode) => bnode.initialize(this));
    await Promise.all(promises);
  }

  refresh(): void {
    const dirtyStatuses = new Map<string, DirtyStatus>();
    for (const bnode of this.board.allNodes) {
      const dirtyStatus = bnode.getDirtyStatus();
      if (dirtyStatus !== DirtyStatus.CLEAN) {
        dirtyStatuses.set(bnode.alias, dirtyStatus);
      }
      bnode.setDirtyStatus(DirtyStatus.CLEAN);
    }
    if (dirtyStatuses.size > 0) {
      this._queue.push({ dirtyStatuses });
    }
  }

  wait(): Promise<void> {
    return this._queue.wait();
  }

  async render({ dirtyStatuses }: IRenderInfo): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const [alias, dirtyStatus] of dirtyStatuses) {
      const bnode = this.board.tryGet(alias);
      if (!bnode) {
        console.warn(`[Renderer] Node is already removed: ${alias}`);
        continue;
      }
      switch (dirtyStatus) {
        case DirtyStatus.CLEAN:
          console.warn(`[Renderer] 'CLEAN' status is not expected: ${alias}`);
          break;
        case DirtyStatus.TRANSFORM_DIRTY:
          promises.push(bnode.updateTransform(this));
          break;
        case DirtyStatus.CONTENT_DIRTY:
          promises.push(bnode.updateContent(this));
          break;
        case DirtyStatus.ALL_DIRTY:
          promises.push(bnode.reRender(this));
          break;
      }
    }
    await Promise.all(promises);
  }
}
