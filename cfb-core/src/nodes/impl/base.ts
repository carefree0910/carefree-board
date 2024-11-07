import type {
  IFillParams,
  IGroupNode,
  IGroupNodeR,
  INodeBase,
  INodeJsonData,
  INodeParamsBase,
  INodeR,
  ISingleNode,
  ISingleNodeR,
  ISolidFillParams,
  IStrokeParams,
  NodeTag,
} from "../types.ts";
import type { PivotType } from "../../toolkit.ts";

import { isGroupNode } from "../types.ts";
import {
  BBox,
  BBoxes,
  blendColors,
  JsonSerializableBase,
  JsonSerializableFactoryBase,
  Matrix2D,
  Point,
  RGBA,
  setDefault,
} from "../../toolkit.ts";
import { DEFAULT_FILL } from "../../constants.ts";

// we keep this 'original' `Map` generic, because it is not public, and we can
// ensure type-safety from the APIs.
// deno-lint-ignore ban-types
const NODE_REGISTRATIONS: Map<string, Function> = new Map();

// constructor of single node
type SNCtor<T extends ISingleNodeR> = new (
  uuid: string,
  alias: string,
  transform: Matrix2D,
  params: T["params"],
  z: number,
) => T;
type GCtor<T extends IGroupNodeR> = new (
  uuid: string,
  alias: string,
  transform: Matrix2D,
  params: T["params"],
  z: number,
  children: INodeR[],
) => T;
type Ctor<T extends INodeR> = T extends ISingleNodeR ? SNCtor<T>
  : T extends IGroupNodeR ? GCtor<T>
  : never;

/**
 * Register a 'concrete' single node implementation.
 *
 * This function will be called internally, and may be useful if you want to extend
 * the current single node types.
 *
 * @param type The type of the single node.
 * @param ctor The class itself.
 */
export function registerSingleNode<T extends ISingleNodeR>(
  type: T["type"],
  ctor: SNCtor<T>,
): void {
  NODE_REGISTRATIONS.set(type, ctor);
}
/**
 * Register a 'concrete' group node implementation.
 *
 * This function will be called internally, and may be useful if you want to extend
 * the current group node types.
 *
 * @param type The type of the single node.
 * @param ctor The class itself.
 */
export function registerGroupNode<T extends IGroupNodeR>(
  type: T["type"],
  ctor: GCtor<T>,
): void {
  NODE_REGISTRATIONS.set(type, ctor);
}

function getSingleNode<T extends ISingleNodeR>(data: INodeJsonData<T>): T {
  const type = data.type;
  const ctor = NODE_REGISTRATIONS.get(type) as SNCtor<T> | undefined;
  if (!ctor) {
    throw new Error(`No single node registered for type '${type}'`);
  }
  return new ctor(
    data.uuid,
    data.alias,
    new Matrix2D(data.transform),
    data.params,
    data.z,
  );
}
function getGroupNode<T extends IGroupNodeR>(data: INodeJsonData<T>): T {
  const type = data.type;
  const ctor = NODE_REGISTRATIONS.get(type) as GCtor<T> | undefined;
  if (!ctor) {
    throw new Error(`No group node registered for type '${type}'`);
  }
  const group = new ctor(
    data.uuid,
    data.alias,
    new Matrix2D(data.transform),
    data.params,
    data.z,
    [],
  );
  group.children = data.children?.map(getNode) ?? [];
  return group;
}
function getNode<T extends INodeR>(data: INodeJsonData<T>): T {
  const type = data.type;
  const ctor = NODE_REGISTRATIONS.get(type) as Ctor<T> | undefined;
  if (!ctor) {
    throw new Error(`No node registered for type '${type}'`);
  }
  const node = ctor.prototype instanceof SingleNodeBase
    ? getSingleNode(data as INodeJsonData<ISingleNodeR>)
    : getGroupNode(data as INodeJsonData<IGroupNodeR>);
  return node as T;
}

class NodeFactory extends JsonSerializableFactoryBase<INodeJsonData, INodeR> {
  fromJsonData<T extends INodeR>(data: INodeJsonData<T>): T {
    return getNode(data);
  }
}
export const NODE_FACTORY: NodeFactory = new NodeFactory();

abstract class NodeBase<T extends INodeR = INodeR>
  extends JsonSerializableBase<INodeJsonData, NodeFactory>
  implements INodeBase {
  abstract type: T["type"];

  uuid: string;
  alias: string;
  transform: Matrix2D;
  params: INodeParamsBase;
  z: number;

  constructor(
    uuid: string,
    alias: string,
    transform: Matrix2D,
    params: INodeParamsBase,
    z: number,
  ) {
    super();
    this.uuid = uuid;
    this.alias = alias;
    this.transform = transform;
    this.params = params;
    this.z = z;
  }

  abstract get x(): number;
  abstract set x(value: number);
  abstract get y(): number;
  abstract set y(value: number);

  get factory(): NodeFactory {
    return NODE_FACTORY;
  }
  get tag(): NodeTag {
    return this.params.tag ?? "entity";
  }
  get customTag(): string | undefined {
    return this.params.customTag;
  }
  get bbox(): BBox {
    return new BBox(this.transform);
  }
  set bbox(value: BBox) {
    this.transform = value.valid.transform;
  }
  get position(): Point {
    return new Point(this.x, this.y);
  }
  set position(value: Point) {
    this.x = value.x;
    this.y = value.y;
  }
  get w(): number {
    return this.bbox.w;
  }
  get h(): number {
    return this.bbox.h;
  }
  get wh(): { w: number; h: number } {
    return this.bbox.wh;
  }
  get absWH(): { w: number; h: number } {
    return this.bbox.absWH;
  }
  get lt(): Point {
    return this.bbox.lt;
  }
  get top(): Point {
    return this.bbox.top;
  }
  get rt(): Point {
    return this.bbox.rt;
  }
  get right(): Point {
    return this.bbox.right;
  }
  get rb(): Point {
    return this.bbox.rb;
  }
  get bottom(): Point {
    return this.bbox.bottom;
  }
  get lb(): Point {
    return this.bbox.lb;
  }
  get left(): Point {
    return this.bbox.left;
  }
  get center(): Point {
    return this.bbox.center;
  }
  pivot(pivot: PivotType): Point {
    return this.bbox.pivot(pivot);
  }
}

export abstract class SingleNodeBase extends NodeBase implements ISingleNode {
  get x(): number {
    return this.transform.e;
  }
  set x(value: number) {
    this.transform.e = value;
  }
  get y(): number {
    return this.transform.f;
  }
  set y(value: number) {
    this.transform.f = value;
  }
  get fillParamsList(): IFillParams[] {
    return setDefault(this.params, "fillParamsList", [
      {
        type: "color",
        color: DEFAULT_FILL,
        opacity: 1,
      },
    ]);
  }
  get strokeParamsList(): IStrokeParams[] {
    return setDefault(this.params, "strokeParamsList", []);
  }
  get visible(): boolean {
    return setDefault(this.params, "visible", true);
  }
  get isMask(): boolean {
    return this.params.tag === "mask";
  }
  get maskAlias(): string | undefined {
    return this.params.maskAlias;
  }
  get blendedFillColor(): RGBA | undefined {
    const fillParamsList = this.fillParamsList?.filter(
      (p) => p.type === "color",
    );
    if (!fillParamsList || fillParamsList.length === 0) {
      return undefined;
    }
    const colors = (
      fillParamsList.filter((p) => p.type === "color") as ISolidFillParams[]
    ).map((p) => RGBA.from(p.color, p.opacity));
    return blendColors(...colors);
  }
  get blendedFillParams(): IFillParams[] {
    const blended: IFillParams[] = [];
    const rgba = this.blendedFillColor;
    if (rgba) {
      blended.push({
        type: "color",
        color: rgba.rgbString,
        opacity: rgba.a,
      });
    }
    this.fillParamsList.forEach((p) => {
      if (p.type === "color") return;
      blended.push(p);
    });
    return blended;
  }

  toJsonData(): INodeJsonData {
    return {
      type: this.type,
      uuid: this.uuid,
      alias: this.alias,
      transform: this.transform.fields,
      params: this.params,
      z: this.z,
    };
  }
}

/**
 * Base class for group nodes.
 *
 * We treat a 'group' to be a simple 'wrapper' of other nodes, which is pretty different
 * from other graphic systems, where they maintain a 'tree' structure and the transformation
 * matrix is 'inherited' from the parent node.
 *
 * Since we simplified the structure, the `transform` of a group node here should not contain
 * translation & scale, but only rotation & flip.
 */
export abstract class GroupNodeBase extends NodeBase implements IGroupNode {
  children: INodeR[];

  constructor(
    uuid: string,
    alias: string,
    transform: Matrix2D,
    params: INodeParamsBase,
    z: number,
    children: INodeR[],
  ) {
    super(uuid, alias, transform, params, z);
    this.children = children;
  }

  get x(): number {
    return this.bbox.lt.x;
  }
  set x(value: number) {
    this._positioning(this.children, new Point(value - this.x, 0));
  }
  get y(): number {
    return this.bbox.lt.y;
  }
  set y(value: number) {
    this._positioning(this.children, new Point(0, value - this.y));
  }

  override get bbox(): BBox {
    const inverse = this.transform.inverse;
    const bboxes = this.children.map((node) => node.bbox.transformBy(inverse));
    const bbox = new BBoxes(bboxes).bbox;
    return bbox.transformBy(this.transform);
  }
  override set bbox(value: BBox) {
    const current = this.transform.valid;
    const target = value.transform.valid;
    this.children.forEach(
      (
        node,
      ) => (node.bbox = node.bbox.transformBy(current.inverse).transformBy(
        target,
      )),
    );
    const currentTransform = current.noMoveScaleButFlip;
    const targetTransform = target.noMoveScaleButFlip;
    this.transform = targetTransform
      .multiply(currentTransform.inverse)
      .multiply(this.transform).valid;
  }

  override toJsonData(): INodeJsonData {
    const data: INodeJsonData = {
      type: this.type,
      uuid: this.uuid,
      alias: this.alias,
      transform: this.transform.fields,
      params: this.params,
      z: this.z,
    };
    data.children = this.children.map((child) => child.toJsonData());
    return data;
  }

  protected _positioning(nodes: INodeR[], delta: Point): void {
    nodes.forEach((node) => {
      if (isGroupNode(node)) {
        this._positioning(nodes, delta);
      } else {
        node.x += delta.x;
        node.y += delta.y;
      }
    });
  }
}
