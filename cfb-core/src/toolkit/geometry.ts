import type { IsCloseOptions } from "./ops.ts";
import { argMax, argMin, getRotation, getSafeNumber, getTheta, isClose } from "./ops.ts";

/**
 * A point in 2D space.
 *
 * @param x - The x coordinate of the point.
 * @param y - The y coordinate of the point.
 */
export class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static origin(): Point {
    return new Point(0, 0);
  }

  static fromPoint(point: { x: number; y: number }): Point {
    return new Point(point.x, point.y);
  }

  get plain(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  get theta(): number {
    return Math.atan2(this.y, this.x);
  }

  get length(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  get reverse(): Point {
    return new Point(-this.x, -this.y);
  }

  scale(scale: number, scaleY?: number): Point {
    return new Point(this.x * scale, this.y * (scaleY ?? scale));
  }

  rotate(theta: number, center?: Point): Point {
    const matrix = Matrix2D.rotationMatrix(theta, center ?? Point.origin());
    return matrix.applyTo(this);
  }

  add(other: Point): Point {
    return new Point(this.x + other.x, this.y + other.y);
  }

  subtract(other: Point): Point {
    return new Point(this.x - other.x, this.y - other.y);
  }

  dot(other: Point): number {
    return this.x * other.x + this.y * other.y;
  }

  angleTo(other: Point): number {
    const eps = 1.0e-5;
    const cos = Math.min(
      1.0 - eps,
      Math.max(-1.0 + eps, this.dot(other) / (this.length * other.length)),
    );
    return Math.acos(cos);
  }

  in(box: IBox): boolean {
    const { x, y } = this;
    const { x: bx, y: by, w, h } = box;
    return x >= bx && x <= bx + w && y >= by && y <= by + h;
  }

  distanceTo(line: Line): number;
  distanceTo(other: Point): number;
  distanceTo(): number {
    const object = arguments[0];
    if (object instanceof Point) {
      return this.subtract(object).length;
    }
    if (object instanceof Line) {
      const { x, y } = this;
      const { x: x1, y: y1 } = object.start;
      const { x: x2, y: y2 } = object.end;
      const area = Math.abs((x2 - x1) * (y1 - y) - (x1 - x) * (y2 - y1));
      const bottom = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      return area / bottom;
    }
    throw Error(`distance to '${typeof object}' is not defined`);
  }

  canProjectOn(line: Line): boolean {
    const delta = line.end.subtract(line.start);
    const offset = this.subtract(line.start);
    const dot = offset.dot(delta);
    return 0 <= dot && dot <= delta.dot(delta);
  }

  toSVGString(): string {
    return `${this.x} ${this.y}`;
  }
}

/**
 * A line in 2D space.
 *
 * @param start - The start `Point` of the line.
 * @param end - The end `Point` of the line.
 */
export class Line {
  start: Point;
  end: Point;

  constructor(start: Point, end: Point) {
    this.start = start;
    this.end = end;
  }

  intersect(other: Line, extendable: boolean = false): Point | undefined {
    const { x: x1, y: y1 } = this.start;
    const { x: x2, y: y2 } = this.end;
    const { x: x3, y: y3 } = other.start;
    const { x: x4, y: y4 } = other.end;
    const x13 = x1 - x3;
    const x21 = x2 - x1;
    const x43 = x4 - x3;
    const y13 = y1 - y3;
    const y21 = y2 - y1;
    const y43 = y4 - y3;
    const denom = y43 * x21 - x43 * y21;
    // parallel
    if (isClose(denom, 0)) return;
    const uA = (x43 * y13 - y43 * x13) / denom;
    const uB = (x21 * y13 - y21 * x13) / denom;
    if (extendable || (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1)) {
      return new Point(x1 + uA * (x2 - x1), y1 + uA * (y2 - y1));
    }
    return undefined;
  }

  distanceTo(targetLine: Line): number {
    const { x: x1, y: y1 } = this.start;
    const { x: x2, y: y2 } = this.end;
    const { x: x4, y: y4 } = targetLine.end;
    const dy = y1 - y2 || 10e-10;
    const k = (x1 - x2) / dy;
    const d = (k * (y2 - y4) + x4 - x2) / Math.sqrt(1 + k ** 2);
    return d;
  }
}

export type PivotType =
  | "lt"
  | "top"
  | "rt"
  | "left"
  | "center"
  | "right"
  | "lb"
  | "bottom"
  | "rb";

export type Matrix2DFields = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
};
export type Matrix2DProperties = {
  x: number;
  y: number;
  theta: number;
  skewX: number;
  skewY: number;
  scaleX: number;
  scaleY: number;
};

export const identityMatrix2DFields: Matrix2DFields = {
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0,
};
// start from top-left, clockwise
export const outerPivots: PivotType[] = [
  "lt",
  "top",
  "rt",
  "right",
  "rb",
  "bottom",
  "lb",
  "left",
];
// start from top-left, clockwise, plus center
export const allPivots: PivotType[] = outerPivots.concat(["center"]);
// start from top-left, clockwise, four corners
export const cornerPivots: PivotType[] = ["lt", "rt", "rb", "lb"];
export const edgePivots: PivotType[] = ["top", "right", "bottom", "left"];
export const midPivots: PivotType[] = edgePivots.concat(["center"]);

/**
 * A 2D (transformation) matrix.
 *
 * The matrix is represented as:
 *
 * | a  c  e |
 * | b  d  f |
 * | 0  0  1 |
 *
 * Which is commonly used in 2D graphics.
 *
 * @param a - The `a` value of the matrix. When there's no rotation / skew, `a` is the scale factor in the x-direction.
 * @param b - The `b` value of the matrix. When there's no rotation / skew, `b` would be 0.
 * @param c - The `c` value of the matrix. When there's no rotation / skew, `c` would be 0.
 * @param d - The `d` value of the matrix. When there's no rotation / skew, `d` is the scale factor in the y-direction.
 * @param e - The `e` value of the matrix. The x translation.
 * @param f - The `f` value of the matrix. The y translation.
 */
export class Matrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  constructor(fields: Matrix2DFields);
  constructor(a: number, b: number, c: number, d: number, e: number, f: number);
  constructor() {
    const { a, b, c, d, e, f } = arguments.length === 1
      ? (arguments[0] as Matrix2DFields)
      : {
        a: arguments[0],
        b: arguments[1],
        c: arguments[2],
        d: arguments[3],
        e: arguments[4],
        f: arguments[5],
      };
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
  }

  static unit(): Matrix2D {
    return new Matrix2D(1, 0, 0, 1, 1, 1);
  }

  static identity(): Matrix2D {
    return new Matrix2D(identityMatrix2DFields);
  }

  static scaleMatrix(
    { w, h }: { w: number; h: number },
    center?: { x: number; y: number },
  ): Matrix2D {
    const { x, y } = center ?? Point.origin();
    return new Matrix2D(w, 0, 0, h, x * (1 - w), y * (1 - h));
  }

  static skewMatrix(
    { skewX, skewY }: { skewX: number; skewY: number },
    center?: { x: number; y: number },
  ): Matrix2D {
    const { x, y } = center ?? Point.origin();
    const tx = Math.tan(skewX);
    const ty = Math.tan(skewY);
    return new Matrix2D(1, ty, tx, 1, -tx * y, -ty * x);
  }

  static rotationMatrix(
    theta: number,
    center?: { x: number; y: number },
  ): Matrix2D {
    const { x, y } = center ?? Point.origin();
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);
    return new Matrix2D(
      cos,
      -sin,
      sin,
      cos,
      (1.0 - cos) * x - y * sin,
      (1.0 - cos) * y + x * sin,
    );
  }

  static moveMatrix({ x, y }: { x: number; y: number }): Matrix2D {
    return new Matrix2D(1, 0, 0, 1, x, y);
  }

  static flipMatrix(
    flipX: boolean,
    flipY: boolean,
    center?: { x: number; y: number },
  ): Matrix2D {
    const fx = flipX ? -1 : 1;
    const fy = flipY ? -1 : 1;
    return Matrix2D.scaleMatrix({ w: fx, h: fy }, center);
  }

  static from(x: number, y: number): Matrix2D;
  static from(x: number, y: number, w: number, h: number): Matrix2D;
  static from(
    x: number,
    y: number,
    w: number,
    h: number,
    theta: number,
  ): Matrix2D;
  static from(properties: Matrix2DProperties): Matrix2D;
  static from(): Matrix2D {
    if (arguments.length === 1) {
      const properties = arguments[0] as Matrix2DProperties;
      const { scaleX: w, scaleY: h } = properties;
      return Matrix2D.skewMatrix(properties)
        .transformBy(Matrix2D.scaleMatrix({ w, h }))
        .transformBy(Matrix2D.rotationMatrix(properties.theta))
        .transformBy(Matrix2D.moveMatrix(properties));
    }
    const x = arguments[0];
    const y = arguments[1];
    let w, h, theta;
    if (arguments.length === 2) {
      w = h = 1;
      theta = 0;
    } else {
      w = arguments[2];
      h = arguments[3];
      theta = arguments.length === 5 ? arguments[4] : 0;
    }
    return Matrix2D.scaleMatrix({ w, h })
      .rotate(theta, Point.origin())
      .move(new Point(x, y));
  }

  get isValid(): boolean {
    const { a, b, c, d, e, f } = this;
    if ([a, b, c, d, e, f].some((n) => Number.isNaN(n))) {
      return false;
    }
    const { x: scaleX, y: scaleY } = this.scales;
    if ([scaleX, scaleY].some((n) => Number.isNaN(n))) {
      return false;
    }
    if (scaleX <= 0 || scaleY === 0) {
      return false;
    }
    return true;
  }

  get valid(): Matrix2D {
    const { a, b, c, d, e, f } = this;
    return new Matrix2D(getSafeNumber(a), b, c, getSafeNumber(d), e, f);
  }

  get theta(): number {
    return -Math.atan2(this.b, this.a);
  }

  get flipX(): boolean {
    return false;
  }

  get flipY(): boolean {
    return this.scaleY < 0;
  }

  get scaleX(): number {
    return Math.sqrt(this.a ** 2 + this.b ** 2);
  }

  get scaleY(): number {
    const { a, b, c, d, scaleX } = this;
    return (a * d - b * c) / Math.max(scaleX, 1.0e-12);
  }

  get scales(): Point {
    const { a, b, c, d, scaleX } = this;
    const scaleY = (a * d - b * c) / Math.max(scaleX, 1.0e-12);
    return new Point(scaleX, scaleY);
  }

  get shear(): number {
    const { a, b, c, d } = this;
    return Math.atan2(a * c + b * d, a ** 2 + b ** 2);
  }

  get inverse(): Matrix2D {
    const { a, b, c, d, e, f } = this;
    const ad = a * d;
    const bc = b * c;
    return new Matrix2D(
      d / (ad - bc),
      b / (bc - ad),
      c / (bc - ad),
      a / (ad - bc),
      (d * e - c * f) / (bc - ad),
      (b * e - a * f) / (ad - bc),
    );
  }

  get translation(): Point {
    return new Point(this.e, this.f);
  }

  get noMove(): Matrix2D {
    const { a, b, c, d } = this;
    return new Matrix2D(a, b, c, d, 0, 0);
  }

  get noSkew(): Matrix2D {
    return this.multiply(
      Matrix2D.skewMatrix({ skewX: -this.shear, skewY: 0.0 }, Point.origin()),
    );
  }

  get noScale(): Matrix2D {
    const { a, b, c, d, e, f, scales } = this;
    const { x, y } = scales;
    return new Matrix2D(a / x, b / x, c / y, d / y, e, f);
  }

  get noScaleButFlip(): Matrix2D {
    const { a, b, c, d, e, f, scales } = this;
    let { x, y } = scales;
    y = Math.abs(y);
    return new Matrix2D(a / x, b / x, c / y, d / y, e, f);
  }

  get noRotation(): Matrix2D {
    return this.rotate(-this.theta, this.translation);
  }

  get noMoveScaleButFlip(): Matrix2D {
    return this.noScaleButFlip.noMove;
  }

  get fields(): Matrix2DFields {
    const { a, b, c, d, e, f } = this;
    return { a, b, c, d, e, f };
  }

  get determinant(): number {
    return this.a * this.d - this.b * this.c;
  }

  skew(shear: number, center?: Point): Matrix2D {
    return Matrix2D.skewMatrix({ skewX: shear, skewY: 0 }, center).multiply(
      this,
    );
  }

  // the scale is applied before the current transformation
  scale(scale: number, scaleY?: number): Matrix2D {
    scaleY = scaleY ?? scale;
    return new Matrix2D(
      this.a * scale,
      this.b * scale,
      this.c * scaleY,
      this.d * scaleY,
      this.e,
      this.f,
    );
  }
  // the scale is applied after the current transformation
  scaleWithCenter(scale: number, scaleY: number, center: Point): Matrix2D {
    return Matrix2D.scaleMatrix({ w: scale, h: scaleY }, center).multiply(this);
  }

  // the scale is applied before the current transformation
  scaleTo(scale: number, scaleY?: number): Matrix2D {
    scaleY = scaleY ?? scale;
    const { x, y } = this.scales;
    return this.scale(scale / x, scaleY / y);
  }
  // the scale is applied after the current transformation
  scaleToWithCenter(scale: number, scaleY: number, center: Point): Matrix2D {
    const { x, y } = this.scales;
    return this.scaleWithCenter(scale / x, scaleY / y, center);
  }

  flip(flipX: boolean, flipY: boolean, center?: Point): Matrix2D {
    return Matrix2D.flipMatrix(flipX, flipY, center).multiply(this);
  }

  rotate(theta: number, center: Point): Matrix2D {
    if (Math.abs(theta) <= 1.0e-12) {
      return this.clone();
    }
    return Matrix2D.rotationMatrix(theta, center).multiply(this);
  }

  rotateTo(theta: number, center: Point): Matrix2D {
    return this.rotate(theta - this.theta, center);
  }

  move({ x, y }: Point): Matrix2D {
    const { a, b, c, d, e, f } = this;
    return new Matrix2D(a, b, c, d, x + e, y + f);
  }

  moveTo({ x, y }: Point): Matrix2D {
    const { a, b, c, d } = this;
    return new Matrix2D(a, b, c, d, x, y);
  }

  multiply({ a: oa, b: ob, c: oc, d: od, e: oe, f: of_ }: Matrix2D): Matrix2D {
    const { a, b, c, d, e, f } = this;
    return new Matrix2D(
      a * oa + c * ob,
      b * oa + d * ob,
      a * oc + c * od,
      b * oc + d * od,
      a * oe + c * of_ + e,
      b * oe + d * of_ + f,
    );
  }

  transformBy(other: Matrix2D): Matrix2D {
    return other.multiply(this);
  }

  applyTo({ x, y }: Point): Point {
    return new Point(
      this.a * x + this.c * y + this.e,
      this.b * x + this.d * y + this.f,
    );
  }

  /**
   * QR docompose
   * this =
   *   skew(shear, 0)
   *   => scale(scaleX, scaleY)
   *   => rotate(theta)
   *   => translate(x, y)
   *
   * or
   *
   * this =
   *   skew(shear, 0)
   *   => flip(false, flipY)
   *   => scale(scaleX, |scaleY|)
   *   => rotate(theta)
   *   => translate(x, y)
   */
  decompose(): Matrix2DProperties {
    const { a, b, c, d, e: x, f: y } = this;
    const scaleX = this.scaleX;
    return {
      x,
      y,
      theta: this.theta,
      skewX: Math.atan2(a * c + b * d, scaleX ** 2),
      skewY: 0.0,
      scaleX,
      scaleY: (a * d - b * c) / Math.max(scaleX, 1.0e-12),
    };
  }

  /** @todo : optimize this */
  setScaleX(scaleX: number): Matrix2D {
    const properties = this.decompose();
    properties.scaleX = scaleX;
    return Matrix2D.from(properties);
  }

  /** @todo : optimize this */
  setScaleY(scaleY: number): Matrix2D {
    const properties = this.decompose();
    properties.scaleY = scaleY;
    return Matrix2D.from(properties);
  }

  /** @todo : optimize this */
  setScales(scaleX: number, scaleY: number): Matrix2D {
    const properties = this.decompose();
    properties.scaleX = scaleX;
    properties.scaleY = scaleY;
    return Matrix2D.from(properties);
  }

  echo(): void {
    const flipY = this.scaleY < 0;
    console.log({
      flipY,
      properties: this.multiply(
        Matrix2D.flipMatrix(false, flipY, Point.origin()),
      ).decompose(),
    });
  }

  clone(): Matrix2D {
    const { a, b, c, d, e, f } = this;
    return new Matrix2D(a, b, c, d, e, f);
  }

  toJson(): string {
    return JSON.stringify(this.fields);
  }

  static fromJson(json: string): Matrix2D {
    return new Matrix2D(JSON.parse(json));
  }
}

/**
 * A high-level interface for a box in 2D space.
 *
 * @property x - The x coordinate of the box.
 * @property y - The y coordinate of the box.
 * @property w - The width of the box.
 * @property h - The height of the box.
 * @property lt - The top-left corner of the box.
 * @property top - The top-center of the box.
 * @property rt - The top-right corner of the box.
 * @property right - The right-center of the box.
 * @property rb - The bottom-right corner of the box.
 * @property bottom - The bottom-center of the box.
 * @property lb - The bottom-left corner of the box.
 * @property left - The left-center of the box.
 * @property center - The center of the box.
 * @property area - The area of the box.
 * @property position - The top-left corner of the box, an alias for `lt`.
 */
export abstract class IBox {
  abstract get x(): number;
  abstract get y(): number;
  abstract get w(): number;
  abstract get h(): number;
  abstract get lt(): Point;
  abstract get top(): Point;
  abstract get rt(): Point;
  abstract get right(): Point;
  abstract get rb(): Point;
  abstract get bottom(): Point;
  abstract get lb(): Point;
  abstract get left(): Point;
  abstract get center(): Point;
  abstract get area(): number;
  abstract pad(padding: number): IBox;

  pivot(pivot: PivotType): Point {
    return this[pivot];
  }
  closeTo(other: IBox, option?: IsCloseOptions): boolean {
    const points = this.cornerPoints;
    const oPoints = other.cornerPoints;
    return points.every((p, i) => {
      const op = oPoints[i];
      if (!isClose(p.x, op.x, option)) return false;
      if (!isClose(p.y, op.y, option)) return false;
      return true;
    });
  }
  get position(): Point {
    return this.lt;
  }
  /** lt -> rt -> rb -> lb */
  get cornerPoints(): Point[] {
    return cornerPivots.map((pivot) => this.pivot(pivot));
  }
  /** top -> right -> bottom -> left -> center */
  get midPoints(): Point[] {
    return midPivots.map((pivot) => this.pivot(pivot));
  }
  /** lt -> top -> rt -> right -> rb -> bottom -> lb -> left -> center */
  get allPoints(): Point[] {
    return allPivots.map((pivot) => this.pivot(pivot));
  }
  /** top -> right -> bottom -> left */
  get edges(): Line[] {
    const corners = this.cornerPoints;
    return corners.map((corner, i) => {
      const next = corners[(i + 1) % 4];
      return new Line(corner, next);
    });
  }
}

/**
 * An axis-aligned bounding box (AABB) in 2D space.
 *
 * > An AABB is a rectangle that is always aligned with the axes of the coordinate system,
 * > hence it has no rotation, skew, or flip (which means `h` is always positive).
 */
export class AABB extends IBox {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    super();
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get lt(): Point {
    return new Point(this.x, this.y);
  }
  get top(): Point {
    return new Point(this.x + 0.5 * this.w, this.y);
  }
  get rt(): Point {
    return new Point(this.x + this.w, this.y);
  }
  get right(): Point {
    return new Point(this.x + this.w, this.y + 0.5 * this.h);
  }
  get rb(): Point {
    return new Point(this.x + this.w, this.y + this.h);
  }
  get bottom(): Point {
    return new Point(this.x + 0.5 * this.w, this.y + this.h);
  }
  get lb(): Point {
    return new Point(this.x, this.y + this.h);
  }
  get left(): Point {
    return new Point(this.x, this.y + 0.5 * this.h);
  }
  get center(): Point {
    return new Point(this.x + 0.5 * this.w, this.y + 0.5 * this.h);
  }
  get area(): number {
    return this.w * this.h;
  }
  pad(padding: number): AABB {
    return new AABB(
      this.x - padding,
      this.y - padding,
      this.w + 2 * padding,
      this.h + 2 * padding,
    );
  }

  get wh(): { w: number; h: number } {
    return { w: this.w, h: this.h };
  }
  get absWH(): { w: number; h: number } {
    return this.wh;
  }
  get isValid(): boolean {
    return this.w > 0 && this.h > 0;
  }

  get leftX(): number {
    return this.x;
  }
  get centerX(): number {
    return this.x + 0.5 * this.w;
  }
  get centerY(): number {
    return this.y + 0.5 * this.h;
  }
  get rightX(): number {
    return this.x + this.w;
  }
  get topY(): number {
    return this.y;
  }
  get bottomY(): number {
    return this.y + this.h;
  }
  get noMove(): AABB {
    return new AABB(0, 0, this.w, this.h);
  }

  resizeTo(w: number, h: number): AABB {
    return new AABB(this.x, this.y, w, h);
  }

  moveTo(x: number, y: number): AABB {
    return new AABB(x, y, this.w, this.h);
  }

  merge(other: AABB): AABB {
    const left = Math.min(this.leftX, other.leftX);
    const right = Math.max(this.rightX, other.rightX);
    const top = Math.min(this.topY, other.topY);
    const bottom = Math.max(this.bottomY, other.bottomY);
    return new AABB(left, top, right - left, bottom - top);
  }

  overlap(other: AABB): AABB {
    const left = Math.max(this.leftX, other.leftX);
    const right = Math.min(this.rightX, other.rightX);
    const top = Math.max(this.topY, other.topY);
    const bottom = Math.min(this.bottomY, other.bottomY);
    return new AABB(left, top, right - left, bottom - top);
  }

  contain(other: IBox): boolean {
    if (other instanceof AABB) {
      return (
        other.leftX >= this.leftX &&
        other.topY >= this.topY &&
        other.rightX <= this.rightX &&
        other.bottomY <= this.bottomY
      );
    }
    const otherCorners = other.cornerPoints;
    for (let i = 0; i < 4; i++) {
      if (!otherCorners[i].in(this)) {
        return false;
      }
    }
    return true;
  }

  move(delta: Point): AABB {
    const { x, y, w, h } = this;
    return new AABB(x + delta.x, y + delta.y, w, h);
  }

  expand(dw: number, dh?: number): AABB {
    const { x, y, w, h } = this;
    dh = dh ?? dw;
    return new AABB(x, y, w + dw, h + dh);
  }

  scale(scale: number, scaleY?: number): AABB {
    const { x, y, w, h } = this;
    scaleY = scaleY ?? scale;
    return new AABB(x, y, w * scale, h * scaleY);
  }

  // Notice that only translation and scales will take effect
  transformBy(transform: Matrix2D): AABB {
    const { x, y, w, h } = this;
    const { x: dx, y: dy } = transform.translation;
    const { x: sw, y: sh } = transform.scales;
    return new AABB(sw * x + dx, sh * y + dy, sw * w, sh * h);
  }

  toBBox(): BBox {
    return new BBox({ a: this.w, b: 0, c: 0, d: this.h, e: this.x, f: this.y });
  }

  // Notice that only lt and wh will take effect
  // In most cases only BBox.bounding should be passed in here
  static from(bbox: BBox): AABB {
    const { x, y } = bbox.lt;
    const { w, h } = bbox.wh;
    return new AABB(x, y, w, h);
  }
}

export const allExpandTypes = ["fixW", "fixH", "iou"] as const;
export type BBoxExpandType = (typeof allExpandTypes)[number];
export type BBoxExpandParams = {
  type: BBoxExpandType;
  pivot: PivotType;
};

/**
 * A general bounding box in 2D space.
 *
 * > Notice that BBox is not necessarily a rectangle - it could be a parallelogram (when skew exists).
 *
 * @param transform - The transformation matrix of the box. Notice that we assume the original w, h should be 1, 1 (unit square)
 */
export class BBox extends IBox {
  transform: Matrix2D;

  constructor(transform: Matrix2D);
  constructor(fields: Matrix2DFields);
  constructor() {
    super();
    this.transform = new Matrix2D(arguments[0]);
  }

  // return a 1x1 unit square
  static unit(): BBox {
    return new BBox(identityMatrix2DFields);
  }

  // get the (flattened) bbox of all (rotated) bboxes
  // flattened : non-rotated
  static fromBBoxes(bboxes: BBoxes): BBox {
    const boxes = bboxes.boxes.map((box) => getBounding(box.outerMost));
    const lx = Math.min(...boxes.map((box) => box.x));
    const rx = Math.max(...boxes.map((box) => box.x + box.w));
    const ty = Math.min(...boxes.map((box) => box.y));
    const by = Math.max(...boxes.map((box) => box.y + box.h));
    return new BBox(Matrix2D.from(lx, ty, rx - lx, by - ty));
  }

  static from(box: IBox): BBox;
  static from(w: number, h: number): BBox;
  static from(x: number, y: number, w: number, h: number): BBox;
  static from(x: number, y: number, w: number, h: number, theta: number): BBox;
  static from(): BBox {
    if (arguments.length === 1) {
      const { x, y, w, h } = arguments[0];
      return BBox.from(x, y, w, h);
    }
    let x, y, w, h, theta;
    switch (arguments.length) {
      case 2: {
        x = y = theta = 0;
        w = arguments[0];
        h = arguments[1];
        break;
      }
      case 4:
      case 5: {
        x = arguments[0];
        y = arguments[1];
        w = arguments[2];
        h = arguments[3];
        theta = arguments.length === 5 ? arguments[4] : 0;
        break;
      }
      default:
        throw Error(`invalid arguments occurred (${arguments})`);
    }
    return new BBox(Matrix2D.from(x, y, w, h, theta));
  }

  get ctm(): Matrix2D {
    return this.transform.noMove;
  }
  get valid(): BBox {
    return new BBox(this.transform.valid);
  }
  get fields(): Matrix2DFields {
    return this.transform.fields;
  }

  get x(): number {
    return this.transform.e;
  }
  get y(): number {
    return this.transform.f;
  }
  get w(): number {
    return this.transform.scaleX;
  }
  get h(): number {
    return this.transform.scaleY;
  }
  get lt(): Point {
    const { e, f } = this.transform;
    return new Point(e, f);
  }
  get top(): Point {
    const { a, b, e, f } = this.transform;
    return new Point(0.5 * a + e, 0.5 * b + f);
  }
  get rt(): Point {
    const { a, b, e, f } = this.transform;
    return new Point(a + e, b + f);
  }
  get right(): Point {
    return this.transform.applyTo(new Point(1.0, 0.5));
  }
  get rb(): Point {
    return this.transform.applyTo(new Point(1.0, 1.0));
  }
  get bottom(): Point {
    return this.transform.applyTo(new Point(0.5, 1.0));
  }
  get lb(): Point {
    const { c, d, e, f } = this.transform;
    return new Point(c + e, d + f);
  }
  get left(): Point {
    const { c, d, e, f } = this.transform;
    return new Point(0.5 * c + e, 0.5 * d + f);
  }
  get center(): Point {
    return this.transform.applyTo(new Point(0.5, 0.5));
  }
  get area(): number {
    return this.transform.determinant;
  }
  pad(padding: number): BBox {
    let { scaleX, scaleY, ...others } = this.decompose();
    scaleX += 2 * padding;
    scaleY += 2 * padding * (isClose(scaleY, 0.0) ? 1 : Math.sign(scaleY));
    const newBBox = new BBox(Matrix2D.from({ scaleX, scaleY, ...others }));
    const centerDelta = this.center.subtract(newBBox.center);
    return newBBox.move(centerDelta);
  }

  get theta(): number {
    return this.transform.theta;
  }
  set theta(value: number) {
    this.transform = this.transform.rotateTo(value, this.center);
  }
  get rotation(): number {
    return getRotation(this.theta);
  }
  set rotation(value: number) {
    this.theta = getTheta(value);
  }
  get flipX(): boolean {
    return false;
  }
  set flipX(value: boolean) {
    if (value) {
      throw Error("`flipX` should not be true");
    }
  }
  get flipY(): boolean {
    return this.h < 0;
  }
  set flipY(value: boolean) {
    const multiplier = value === this.flipY ? 1 : -1;
    this.transform.c *= multiplier;
    this.transform.d *= multiplier;
  }
  get wh(): { w: number; h: number } {
    const { x, y } = this.transform.scales;
    return { w: x, h: y };
  }
  get absWH(): { w: number; h: number } {
    const { x, y } = this.transform.scales;
    return { w: x, h: Math.abs(y) };
  }

  get leftMost(): Point {
    const cornerPoints = this.cornerPoints;
    const xs = cornerPoints.map((point) => point.x);
    return cornerPoints[argMin(xs)];
  }
  get rightMost(): Point {
    const cornerPoints = this.cornerPoints;
    const xs = cornerPoints.map((point) => point.x);
    return cornerPoints[argMax(xs)];
  }
  get topMost(): Point {
    const cornerPoints = this.cornerPoints;
    const ys = cornerPoints.map((point) => point.y);
    return cornerPoints[argMin(ys)];
  }
  get bottomMost(): Point {
    const cornerPoints = this.cornerPoints;
    const ys = cornerPoints.map((point) => point.y);
    return cornerPoints[argMax(ys)];
  }

  get noMove(): BBox {
    return new BBox(this.transform.noMove);
  }
  get noSkew(): BBox {
    return new BBox(this.transform.noSkew);
  }
  get noScale(): BBox {
    return new BBox(this.transform.noScale);
  }
  get noScaleButFlip(): BBox {
    return new BBox(this.transform.noScaleButFlip);
  }
  get noRotation(): BBox {
    return new BBox(this.transform.noRotation);
  }

  get outerMost(): {
    left: Point;
    top: Point;
    right: Point;
    bottom: Point;
  } {
    return getOuterMost(this.cornerPoints);
  }
  get bounding(): BBox {
    const { x, y, w, h } = getBounding(this.outerMost);
    return BBox.from(x, y, w, h);
  }

  contain(other: IBox): boolean {
    const otherCorners = other.cornerPoints;
    for (let i = 0; i < 4; i++) {
      if (!otherCorners[i].in(this)) {
        return false;
      }
    }
    return true;
  }

  areaBiggerThan(other: BBox): boolean {
    return this.w * this.h >= other.w * other.h;
  }

  move(delta: Point): BBox {
    return new BBox(this.transform.move(delta));
  }

  moveTo(target: Point): BBox {
    return new BBox(this.transform.moveTo(target));
  }

  rotate(deltaTheta: number, center: Point): BBox {
    return new BBox(this.transform.rotate(deltaTheta, center));
  }

  rotateTo(theta: number, center: Point): BBox {
    return new BBox(this.transform.rotateTo(theta, center));
  }

  scale(scale: number, scaleY?: number): BBox {
    return new BBox(this.transform.scale(scale, scaleY));
  }
  scaleWithCenter(scale: number, scaleY: number, center: Point): BBox {
    return new BBox(this.transform.scaleWithCenter(scale, scaleY, center));
  }

  flip(flipX: boolean, flipY: boolean, center?: Point): BBox {
    return new BBox(this.transform.flip(flipX, flipY, center));
  }

  /**
   * This method will move the pivot to the `target`, while keeping the opposite pivot
   * of the target pivot unchanged.
   *
   * @param target The target point to move the pivot to.
   * @param pivot The pivot to move.
   * @param keepAspectRatio Whether to keep the aspect ratio.
   * @returns The new BBox after the pivot is moved.
   */
  extendTo(target: Point, pivot: PivotType, keepAspectRatio: boolean): BBox {
    const unit = BBox.unit();
    let { x, y, w, h } = unit;
    const unitPivot = unit.pivot(pivot);
    target = this.transform.inverse.applyTo(target).subtract(unitPivot);
    let { x: tx, y: ty } = target;
    if (keepAspectRatio) {
      switch (pivot) {
        case "lt":
        case "lb":
        case "rb":
        case "rt": {
          const center = unit.pivot(mirroredPivot(pivot)).subtract(unitPivot);
          const delta = target.subtract(center);
          const r = Math.max(Math.abs(delta.x), Math.abs(delta.y));
          const scale = getQuadrant(delta);
          target = center.add(scale.scale(r));
          tx = target.x;
          ty = target.y;
          break;
        }
      }
    }
    let dx, dy;
    switch (pivot) {
      case "lt": {
        w += x - tx;
        h += y - ty;
        x = tx;
        y = ty;
        break;
      }
      case "top": {
        dy = y - ty;
        h += dy;
        if (keepAspectRatio) {
          w += dy;
          x -= 0.5 * dy;
        }
        y = ty;
        break;
      }
      case "rt": {
        w += tx - x;
        h += y - ty;
        y = ty;
        break;
      }
      case "left": {
        dx = x - tx;
        w += dx;
        if (keepAspectRatio) {
          h += dx;
          y -= 0.5 * dx;
        }
        x = tx;
        break;
      }
      case "right": {
        dx = tx - x;
        w += dx;
        if (keepAspectRatio) {
          h += dx;
          y -= 0.5 * dx;
        }
        break;
      }
      case "lb": {
        w += x - tx;
        h += ty - y;
        x = tx;
        break;
      }
      case "bottom": {
        dy = ty - y;
        h += dy;
        if (keepAspectRatio) {
          w += dy;
          x -= 0.5 * dy;
        }
        break;
      }
      case "rb": {
        w += tx - x;
        h += ty - y;
        break;
      }
    }
    const transform = this.transform
      .multiply(Matrix2D.moveMatrix({ x, y }))
      .scale(w, h);
    const bbox = new BBox(transform);
    return bbox;
  }

  /**
   * This method will rotate the pivot to the `target`, while keeping the center unchanged.
   *
   * @param target The target point to rotate the pivot to.
   * @param pivot The pivot to rotate.
   * @param divide The degree to divide the rotation. If not provided, the rotation will be continuous.
   * @returns The new BBox after the pivot is rotated.
   */
  rotatePivotTo(
    target: Point,
    pivot: PivotType | Point,
    divide?: number,
  ): BBox {
    const center = this.center;
    const operationPivot = typeof pivot === "string" ? this.pivot(pivot) : pivot;
    const offset = typeof pivot === "string" ? 0 : Math.PI * 0.5;
    const currentVec = operationPivot.subtract(center);
    const targetVec = target.subtract(center);
    let theta = currentVec.theta - targetVec.theta + this.theta;
    if (divide) {
      theta += offset;
      const candidates = new Array(25)
        .fill(0)
        .map((_: number, idx: number) => getTheta(-180) + idx * divide);
      const diffs = candidates.map((value) => Math.abs(value - theta));
      const minIndex = argMin(diffs);
      theta = candidates[minIndex] - offset;
    }
    return this.rotateTo(theta, center);
  }

  transformBy(transform: Matrix2D): BBox {
    return new BBox(this.transform.transformBy(transform));
  }

  toAABB(): AABB {
    const { x, y } = this.lt;
    const { w, h } = this.wh;
    if (h >= 0) {
      return new AABB(x, y, w, h);
    }
    return new AABB(x - w, y, w, -h);
  }

  setW(w: number): BBox {
    return new BBox(this.transform.setScaleX(getSafeNumber(w)));
  }

  setH(h: number): BBox {
    return new BBox(this.transform.setScaleY(getSafeNumber(h)));
  }

  setWH(w: number, h: number): BBox {
    return new BBox(
      this.transform.setScales(getSafeNumber(w), getSafeNumber(h)),
    );
  }

  setWHRatio(whRatio: number, { type, pivot }: BBoxExpandParams): BBox {
    const oPivot = this.pivot(pivot);
    const { w, h } = this.wh;
    const absH = Math.abs(h);
    const hSign = Math.sign(h);
    let newW, newH;
    switch (type) {
      case "fixW": {
        newW = w;
        newH = (hSign * w) / whRatio;
        break;
      }
      case "fixH": {
        newW = absH * whRatio;
        newH = h;
        break;
      }
      case "iou":
      default: {
        const area = w * absH;
        newW = Math.sqrt(area * whRatio);
        newH = (hSign * area) / newW;
        break;
      }
    }
    const bbox = this.setWH(newW, newH);
    const delta = oPivot.subtract(bbox.pivot(pivot));
    return bbox.move(delta);
  }

  decompose(): Matrix2DProperties {
    return this.transform.decompose();
  }

  lerp(other: BBox, ratio: number): BBox {
    const { x, y, theta, skewX, skewY, scaleX, scaleY } = this.decompose();
    const {
      x: tx,
      y: ty,
      theta: tTheta,
      skewX: tSkewX,
      skewY: tSkewY,
      scaleX: tScaleX,
      scaleY: tScaleY,
    } = other.decompose();
    return new BBox(
      Matrix2D.from({
        x: x * (1.0 - ratio) + tx * ratio,
        y: y * (1.0 - ratio) + ty * ratio,
        theta: theta * (1.0 - ratio) + tTheta * ratio,
        skewX: skewX * (1.0 - ratio) + tSkewX * ratio,
        skewY: skewY * (1.0 - ratio) + tSkewY * ratio,
        scaleX: scaleX * (1.0 - ratio) + tScaleX * ratio,
        scaleY: scaleY * (1.0 - ratio) + tScaleY * ratio,
      }),
    );
  }

  echo(): void {
    this.transform.echo();
  }

  clone(): BBox {
    return new BBox(this.transform.clone());
  }
}

export class BBoxes {
  boxes: BBox[];

  constructor(boxes: BBox[]) {
    this.boxes = boxes;
  }

  // get the (flattened) bbox of all (rotated) bboxes
  // flattened : non-rotated
  get bbox(): BBox {
    return BBox.fromBBoxes(this);
  }

  get center(): Point {
    return this.bbox.center;
  }

  get leftMost(): BBox {
    return this.boxes.sort((b1, b2) => b1.leftMost.x > b2.leftMost.x ? 1 : -1)[0];
  }

  get rightMost(): BBox {
    return this.boxes.sort((b1, b2) => b1.rightMost.x > b2.rightMost.x ? -1 : 1)[0];
  }

  get topMost(): BBox {
    return this.boxes.sort((b1, b2) => b1.topMost.y > b2.topMost.y ? 1 : -1)[0];
  }

  get bottomMost(): BBox {
    return this.boxes.sort((b1, b2) => b1.bottomMost.y > b2.bottomMost.y ? -1 : 1)[0];
  }

  push(bbox: BBox): void {
    this.boxes.push(bbox);
  }
}

// helper functions

export function mirroredPivot(pivot: PivotType): PivotType {
  if (pivot === "center") {
    return "center";
  }
  return allPivots[(allPivots.indexOf(pivot) + 4) % 8];
}

export function getOuterMost(cornerPoints: Point[]): {
  left: Point;
  top: Point;
  right: Point;
  bottom: Point;
} {
  const xs = cornerPoints.map((point) => point.x);
  const ys = cornerPoints.map((point) => point.y);
  const left = cornerPoints[argMin(xs)];
  const right = cornerPoints[argMax(xs)];
  const top = cornerPoints[argMin(ys)];
  const bottom = cornerPoints[argMax(ys)];
  return { left, top, right, bottom };
}

export function getBounding(outerMost: {
  left: Point;
  top: Point;
  right: Point;
  bottom: Point;
}): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const { left, top, right, bottom } = outerMost;
  return { x: left.x, y: top.y, w: right.x - left.x, h: bottom.y - top.y };
}

export function getQuadrant({ x, y }: Point): Point {
  if (x <= 0 && y <= 0) {
    return new Point(-1, -1);
  }
  if (x <= 0 && y > 0) {
    return new Point(-1, 1);
  }
  if (x > 0 && y > 0) {
    return new Point(1, 1);
  }
  return new Point(1, -1);
}
