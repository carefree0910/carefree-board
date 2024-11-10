import type { IPointerData, PointerEventType, StopPropagate } from "./base.ts";
import type { Dictionary, Point } from "../../toolkit.ts";
import type { IMakeNode, INodeR } from "../../nodes.ts";
import type { IWorld } from "../../world.ts";

import {
  getPointerHandlers,
  PointerButton,
  PointerHandlerBase,
  registerPointerHandler,
} from "./base.ts";
import { makeNode } from "../../nodes.ts";

/**
 * The 'global' data that will be shared among different callbacks.
 *
 * If you are familiar with `mobx`, you may notice that this is just a simplified version
 * of the `mobx` store.
 *
 * See {@link IUIHandler} for the overall design of UI elements.
 */
export type UIStore<D, W extends IWorld> = {
  get: <K extends keyof D>(key: K) => D[K];
  set: <K extends keyof D>(key: K, value: D[K], world: W) => void;
};
type UIEventCallbackData<D, T extends INodeR, W extends IWorld> = {
  node: T;
  world: W;
  store: UIStore<D, W>;
};
/**
 * The callback that will be triggered by pointer events.
 *
 * See {@link IUIHandler} for the overall design of UI elements.
 */
export type UIEventCallback<D, T extends INodeR, W extends IWorld> = (
  data: UIEventCallbackData<D, T, W>,
) => void;
/**
 * The states of an UI element.
 *
 * See {@link IUIHandler} for the overall design of UI elements.
 */
export enum UIState {
  /**
   * The UI element is idle.
   */
  IDLE,
  /**
   * The pointer enters the UI element.
   */
  ENTER,
  /**
   * The pointer is pressing the UI element.
   */
  PRESS,
}
/**
 * ***WARNING**: This is more of a POC / development purpose than something that can
 * be used in production. `carefree-board` supports integration with mature frontend
 * frameworks (e.g., `react`), so you may want to see `cfb-react` if you are looking
 * for a more complete solution.*
 *
 * An UI element.
 *
 * Here we treat a pointer event handler as an UI element, and we think it is an
 * essential design. After all, an UI element is something that reacts to different
 * pointer events and triggers different callbacks.
 *
 * To achieve UI-ish behaviors, we will treat the UI handler as a state machine,
 * and allow users to define different callbacks for different states, as well as
 * define the actions performed during the state transitions.
 *
 * Another important design is the `store`, the workflow of the `store` is:
 *
 * 1. Every state callback / transition callback will receive the `store` as input.
 * 2. The `store` has a `get` and a `set` method, which can be used to get and set
 *    the data in the `store`.
 * 3. When the data in the `store` is changed, the corresponding state callback will be
 *    called again.
 *
 * If you are familiar with `mobx`, you may notice that this is just a simplified version
 * of the `mobx` store.
 */
export interface IUIHandler<D, T extends INodeR, W extends IWorld> {
  /**
   * The `node` that this UI element will use to display itself.
   *
   * > A common choice is to use the {@link RectangleNode}.
   */
  node: T;
  /**
   * The 'global' data that will be shared among different callbacks.
   *
   * > This will not be exposed to the callbacks. Instead, a `getter` and a `setter`
   * > will wrap around it to provide a more controlled way to access / modify the data,
   * > as mentioned in the overall design.
   */
  store: D;
  /**
   * Pointer buttons that will trigger the UI element, default is `[PointerButton.LEFT]`.
   */
  focus?: PointerButton[];
  /**
   * The callback to be called at binding.
   */
  onBind?: (data: { world: W; store: UIStore<D, W> }) => void;
  /**
   * The callback to be called at `IDLE` state of {@link UIState}.
   */
  onIdle?: UIEventCallback<D, T, W>;
  /**
   * The callback to be called at `ENTER` state of {@link UIState}.
   */
  onEnter?: UIEventCallback<D, T, W>;
  /**
   * The callback to be called at `PRESS` state of {@link UIState}.
   */
  onPress?: UIEventCallback<D, T, W>;
  /**
   * The callback to be called at a 'click' event. A 'click' event is triggered when:
   *
   * 1. The pointer is pressing the UI element.
   * 2. The pointer is released and still in the UI element.
   */
  onClick?: UIEventCallback<D, T, W>;
  /**
   * The callback to be called at state transitions.
   */
  onTransition?: (from: UIState, to: UIState, world: W, store: UIStore<D, W>) => void;
}
/**
 * An UI element.
 *
 * See {@link IUIHandler} for the overall design of UI elements.
 */
export class UIHandler<D, T extends INodeR, W extends IWorld>
  extends PointerHandlerBase<W> {
  node: T;
  private store: UIStore<D, W>;
  private storeData: D;
  private state: UIState;
  private focus: PointerButton[];
  private onBind?: IUIHandler<D, T, W>["onBind"];
  private onIdle?: UIEventCallback<D, T, W>;
  private onEnter?: UIEventCallback<D, T, W>;
  private onPress?: UIEventCallback<D, T, W>;
  private onClick?: UIEventCallback<D, T, W>;
  private onTransition?: IUIHandler<D, T, W>["onTransition"];
  private pointer?: Point | null = null;

  constructor(params: IUIHandler<D, T, W>) {
    super();
    if (params.node.tag !== "ui") {
      throw new Error("The node given to the `UIHandler` must be a `ui` node.");
    }
    this.state = UIState.IDLE;
    this.node = params.node;
    this.store = {
      get: this.getStore.bind(this),
      set: this.setStore.bind(this),
    };
    this.storeData = params.store;
    this.focus = params.focus ?? [PointerButton.LEFT];
    this.onBind = params.onBind;
    this.onIdle = params.onIdle;
    this.onEnter = params.onEnter;
    this.onPress = params.onPress;
    this.onClick = params.onClick;
    this.onTransition = params.onTransition;
  }

  bind(world: W): void {
    this.onBind?.({ world, store: this.store });
  }

  /**
   * Dispatch pointer events to the UI element's callbacks.
   *
   * See {@link IUIHandler} for the overall design of UI elements.
   *
   * @param data The pointer data.
   * @returns Whether to stop propagating the pointer event.
   */
  exec(data: IPointerData<W>): Promise<StopPropagate> {
    switch (data.e.type) {
      case "onPointerDown": {
        if (!this.focus.includes(data.e.button)) {
          break;
        }
        this.pointer = this.getPointer(data);
        if (this.pointer.in(this.node.bbox)) {
          const prev = this.state;
          this.state = UIState.PRESS;
          this.onTransition?.(prev, this.state, data.world, this.store);
          this.onPress?.(this.getEventData(data.world));
        } else {
          const prev = this.state;
          this.state = UIState.IDLE;
          if (prev !== this.state) {
            this.onTransition?.(prev, this.state, data.world, this.store);
            this.onIdle?.(this.getEventData(data.world));
          }
        }
        break;
      }
      case "onPointerMove": {
        this.pointer = this.getPointer(data);
        if (this.state !== UIState.PRESS) {
          if (this.pointer.in(this.node.bbox)) {
            const prev = this.state;
            this.state = UIState.ENTER;
            if (prev !== this.state) {
              this.onTransition?.(prev, this.state, data.world, this.store);
              this.onEnter?.(this.getEventData(data.world));
            }
          } else {
            const prev = this.state;
            this.state = UIState.IDLE;
            if (prev !== this.state) {
              this.onTransition?.(prev, this.state, data.world, this.store);
              this.onIdle?.(this.getEventData(data.world));
            }
          }
        }
        break;
      }
      case "onPointerUp": {
        if (this.state === UIState.PRESS) {
          const pointed = this.pointer?.in(this.node.bbox) ?? false;
          this.state = data.env === "touch"
            ? UIState.IDLE
            : pointed
            ? UIState.ENTER
            : UIState.IDLE;
          if (pointed) {
            this.onClick?.(this.getEventData(data.world));
          }
          this.onTransition?.(UIState.PRESS, this.state, data.world, this.store);
          if (this.state === UIState.IDLE) {
            this.onIdle?.(this.getEventData(data.world));
          } else {
            this.onEnter?.(this.getEventData(data.world));
          }
          this.pointer = null;
        }
        break;
      }
    }
    return Promise.resolve(this.state === UIState.PRESS);
  }

  private getStore<K extends keyof D>(key: K): D[K] {
    return this.storeData[key];
  }
  private setStore<K extends keyof D>(key: K, value: D[K], world: W): void {
    this.storeData[key] = value;
    switch (this.state) {
      case UIState.IDLE:
        this.onIdle?.(this.getEventData(world));
        break;
      case UIState.ENTER:
        this.onEnter?.(this.getEventData(world));
        break;
      case UIState.PRESS:
        this.onPress?.(this.getEventData(world));
        break;
    }
  }
  private getEventData(world: W): UIEventCallbackData<D, T, W> {
    return { node: this.node, world: world, store: this.store };
  }
}

/**
 * The parameters to create an UI element.
 */
export interface IMakeUIElement<D, T extends INodeR, W extends IWorld> {
  /**
   * The 'global' data that will be shared among different callbacks.
   */
  store: D;
  /**
   * Pointer buttons that will trigger the UI element, default is `[PointerButton.LEFT]`.
   */
  focus?: PointerButton[];
  /**
   * The data to create the UI element's `node`.
   */
  nodeData: IMakeNode<T>;
  /**
   * The callbacks that will be called by the UI element.
   */
  callbacks: Omit<IUIHandler<D, T, W>, "node" | "store" | "focus">;
  /**
   * Whether to register the UI element to the `world`, default is `true`.
   */
  register?: boolean;
}
/**
 * Create an UI element.
 *
 * You can either store each created UI element in an array by yourself, or use the
 * {@link getUIElements} function to collect all registered UI elements.
 *
 * Here's an example of how to actually render your UI elements, but using
 * {@link getUIElements} is preferred:
 *
 * ```ts
 * import { Graph, makeUIElement, Matrix2D } from "@carefree0910/cfb-core";
 *
 * const ui = makeUIElement({
 *   store: { activated: false },
 *   nodeData: {
 *     type: "rectangle",
 *     alias: "foo",
 *     transform: Matrix2D.from(50, 50, 50, 50),
 *     params: {
 *       tag: "ui",
 *       fillParamsList: [{ type: "color", color: "#000000", opacity: 0.25 }],
 *     },
 *     z: 0,
 *   },
 *   callbacks: {},
 * });
 *
 * const nodes = []; // other 'normal' nodes
 * nodes.push(ui.node);
 * const graph = Graph.fromNodes(nodes);
 * console.log(graph);
 *
 * // then initialize renderer / plugins / event system / world / ...
 * ```
 *
 * @param params The parameters to create an UI element.
 * @returns The created UI element.
 */
export function makeUIElement<D, T extends INodeR, W extends IWorld>(
  params: IMakeUIElement<D, T, W>,
): UIHandler<D, T, W> {
  const node = makeNode(params.nodeData);
  const ui = new UIHandler({
    node,
    store: params.store,
    focus: params.focus,
    ...params.callbacks,
  });
  if (params.register ?? true) {
    registerPointerHandler("onPointerDown", ui);
    registerPointerHandler("onPointerMove", ui);
    registerPointerHandler("onPointerUp", ui);
  }
  return ui;
}
/**
 * Get all inner `node`s of the existing UI elements in the `world`.
 *
 * This is the preferred way to collect all registered UI elements and render them.
 * Here's an example:
 *
 * ```ts
 * import type { ISingleNodeR } from "@carefree0910/cfb-core";
 *
 * import { getUIElements, Graph, makeUIElement, Matrix2D } from "@carefree0910/cfb-core";
 *
 * makeUIElement({
 *   store: { activated: false },
 *   nodeData: {
 *     type: "rectangle",
 *     alias: "foo",
 *     transform: Matrix2D.from(50, 50, 50, 50),
 *     params: {
 *       tag: "ui",
 *       fillParamsList: [{ type: "color", color: "#000000", opacity: 0.25 }],
 *     },
 *     z: 0,
 *   },
 *   callbacks: {},
 * });
 *
 * let nodes: INodeR[] = []; // other 'normal' nodes
 * nodes = nodes.concat(getUIElements());
 * const graph = Graph.fromNodes(nodes);
 * console.log(graph);
 *
 * // then initialize renderer / plugins / event system / world / ...
 * ```
 *
 * In this way, you can decouple the definition of UI elements and the main entry
 * point. For example, you can define the UI elements in a separate file, and then
 * simply call `getUIElements` in the main file to render them.
 *
 * See `cfb-web/public/ui.ts` and `cfb-web/public/index.ts` for a concrete example.
 */
export function getUIElements(): INodeR[] {
  const existing: Dictionary<INodeR> = {};
  for (const event of ["onPointerDown", "onPointerMove", "onPointerUp"]) {
    for (const handler of getPointerHandlers(event as PointerEventType)) {
      if (handler instanceof UIHandler) {
        existing[handler.node.alias] = handler.node;
      }
    }
  }
  return Object.values(existing);
}
