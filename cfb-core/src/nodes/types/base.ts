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
 * Common parameters for all nodes.
 *
 * @param fill Fill color.
 * @param stroke Stroke color.
 * @param strokeWidth Stroke width.
 * @param opacity Opacity.
 * @param visible Visibility.
 */
export interface INodeParams {
  fillParamsList?: IFillParams[];
  strokeParamsList?: IStrokeParams[];
  opacity?: number;
  visible?: boolean;
  isMask?: boolean;
  maskAlias?: string;
}

export interface INodeData {
  uuid: string;
  alias: string;
  transform: Matrix2D;
  params: INodeParams;
  z: number;
}
export interface INodeJsonData<T extends INodeR = INodeR>
  extends Omit<INodeData, "transform"> {
  type: T["type"];
  transform: Matrix2DFields;
  children?: INodeJsonData[];
}

/**
 * Base interface for all nodes.
 *
 * > Please DONT use this interface when implementing higher-level functions / interfaces, as this interface is not 'realized' and does not contain enough information of the 'concrete' node types.
 * >
 * > Instead, use `ISingleNodeR` / `IGroupR` / `INodeR` defined in `cfb-core/src/nodes/types.ts`.
 *
 * @param alias Node alias.
 * @param transform The 2D transformation matrix.
 * @param params Node parameters.
 * @param z Z-index.
 */
export interface INodeBase extends INodeData, JsonSerializable<INodeJsonData> {
  get bbox(): BBox;
  set bbox(value: BBox);
  set x(value: number);
  set y(value: number);
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
  get opacity(): number;
  get visible(): boolean;
  get isMask(): boolean;
  get maskAlias(): string | undefined;
  get blendedFillColor(): RGBA | undefined;
  get blendedFillParams(): IFillParams[];
}
