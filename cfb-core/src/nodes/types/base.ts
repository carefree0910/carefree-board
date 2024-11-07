import type { INodeR } from "../types.ts";
import type {
  BBox,
  JsonSerializable,
  Matrix2D,
  Matrix2DFields,
  PivotType,
  Point,
  RGBA,
} from "../../toolkit.ts";

export interface ISolidFillParams {
  type: "color";
  color: string;
  opacity: number;
}
export interface IImageFillParams {
  type: "image";
  src: string;
}
export interface GradientStopItem {
  color: string;
  opacity: number;
  position: number;
}
export interface ILinearFillParams {
  type: "linear";
  direction: number;
  gradientStops: GradientStopItem[];
  opacity: number;
}
export type IFillParams =
  | ISolidFillParams
  | IImageFillParams
  | ILinearFillParams;
export interface IStrokeParams {
  color: string;
  opacity: number;
  width: number;
}

/**
 * The built-in tag - or content type - of the node.
 *
 * This is not a 'strict' property. As its name suggests, it is a 'tag' so downstream
 * layers can use it to categorize nodes and apply different behaviors.
 *
 * Here are the semantic meanings of each tag:
 *
 * - `ui`: UI nodes.
 * - `entity`: Entities, or 'normal' nodes. Most nodes should be tagged as `entity`.
 * - `background`: Background node. A background node is defined to have following properties:
 *   - One per page / document.
 *   - Usually cannot be transformed in real-time (e.g., pointer events).
 *   - Stay at the bottom of all nodes.
 * - `mask`: Mask node, which is used to mask other nodes.
 *
 * If downstream layers want to customize the tag, they should ignore this type and define
 * their own tags under the {@link INodeParamsBase.customTag} field.
 */
export type NodeTag = "ui" | "entity" | "background" | "mask";

/**
 * Common parameters for all nodes.
 *
 * @param tag Built-in tag.
 * @param customTag Custom tag, useful for downstream layers to categorize nodes.
 * @param fillParamsList Fill parameters.
 * @param strokeParamsList Stroke parameters.
 * @param visible Visibility.
 * @param maskAlias If the node is masked, this is the alias of the mask node.
 */
export interface INodeParamsBase {
  tag?: NodeTag;
  customTag?: string;
  fillParamsList?: IFillParams[];
  strokeParamsList?: IStrokeParams[];
  visible?: boolean;
  maskAlias?: string;
}

export interface INodeData<T extends INodeR> {
  uuid: string;
  alias: string;
  transform: Matrix2D;
  params: T["params"];
  z: number;
}
export interface INodeJsonData<T extends INodeR = INodeR>
  extends Omit<INodeData<T>, "transform"> {
  type: T["type"];
  transform: Matrix2DFields;
  children?: INodeJsonData[];
}

/**
 * Base interface for all nodes.
 *
 * > Please DONT use this interface when implementing higher-level functions / interfaces,
 * > as this interface is not 'realized' and does not contain enough information of the
 * > 'concrete' types. Please use {@link ISingleNodeR} / {@link IGroupR} / {@link INodeR}
 * > instead.
 */
export interface INodeBase extends INodeData<INodeR>, JsonSerializable<INodeJsonData> {
  params: INodeParamsBase;

  get tag(): NodeTag;
  get customTag(): string | undefined;
  get bbox(): BBox;
  set bbox(value: BBox);
  get x(): number;
  set x(value: number);
  get y(): number;
  set y(value: number);
  get position(): Point;
  set position(value: Point);
  get w(): number;
  get h(): number;
  get wh(): { w: number; h: number };
  get absWH(): { w: number; h: number };
  get lt(): Point;
  get top(): Point;
  get rt(): Point;
  get right(): Point;
  get rb(): Point;
  get bottom(): Point;
  get lb(): Point;
  get left(): Point;
  get center(): Point;
  pivot(pivot: PivotType): Point;

  snapshot(): this;
}

/**
 * Base interface for all 'groups', which are nodes that contain other nodes.
 *
 * > Please DONT use this interface when implementing higher-level functions / interfaces, as this interface is not 'realized' and does not contain enough information of the 'concrete' node types.
 * >
 * > Instead, use `IGroupR` defined in `cfb-core/src/nodes/types.ts`.
 *
 * @param children Child nodes.
 */
export interface IGroup extends INodeBase {
  children: INodeR[];
}

/**
 * Base interface for all 'single' nodes, which are nodes that do not contain other nodes. It can also be treated as 'renderable' nodes.
 *
 * > Please DONT use this interface when implementing higher-level functions / interfaces, as this interface is not 'realized' and does not contain enough information of the 'concrete' node types.
 * >
 * > Instead, use `ISingleNodeR` defined in `cfb-core/src/nodes/types.ts`.
 */
export interface ISingleNode extends INodeBase {
  get fillParamsList(): IFillParams[];
  get strokeParamsList(): IStrokeParams[];
  get visible(): boolean;
  get isMask(): boolean;
  get maskAlias(): string | undefined;
  get blendedFillColor(): RGBA | undefined;
  get blendedFillParams(): IFillParams[];
}
