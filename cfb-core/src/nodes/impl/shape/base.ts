import type { Matrix2D, Point } from "../../../toolkit.ts";
import type { IShapeNode, IVertex } from "../../types.ts";

import { SingleNodeBase } from "../base.ts";

export class Vertex implements IVertex {
  p0: Point;
  p1?: Point;
  p2?: Point;
  p3?: Point;

  constructor(p0: Point, p1?: Point, p2?: Point, p3?: Point) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }

  transformBy(matrix: Matrix2D): Vertex {
    return new Vertex(
      matrix.applyTo(this.p0),
      this.p1 ? matrix.applyTo(this.p1) : undefined,
      this.p2 ? matrix.applyTo(this.p2) : undefined,
      this.p3 ? matrix.applyTo(this.p3) : undefined,
    );
  }
}

export abstract class ShapeNodeBase extends SingleNodeBase implements IShapeNode {
  abstract getRawVertices(): IVertex[];

  get minOfWH(): number {
    const { w, h } = this.wh;
    return Math.min(w, Math.abs(h));
  }
  getVertices(transform: Matrix2D): IVertex[] {
    return this.getRawVertices().map((vertex) => vertex.transformBy(transform));
  }
}

// helpers

function safeDenominator(n: number): number {
  return Math.max(n, 1.0e-8);
}
function adjust(
  p0: Point,
  p1: Point,
  offset0: number,
  offset1: number,
  eps: number = 1.0e-3,
): number[] {
  const length = p0.subtract(p1).length;
  const diff = offset0 + offset1 - length;
  if (diff > 0.0) {
    const r01 = offset0 / safeDenominator(offset0 + offset1);
    offset0 = Math.max(eps, offset0 - diff * r01) - eps;
    offset1 = length - offset0 - 2.0 * eps;
  }
  return [offset0, offset1];
}
class OffsetInfo {
  theta: number;
  offset: number;

  constructor(theta: number, offset: number) {
    this.theta = theta;
    this.offset = offset;
  }

  get radius(): number {
    return this.offset * Math.tan(0.5 * this.theta);
  }
}
function getRadiusOffsetInfo(
  p0: Point,
  p1: Point,
  p2: Point,
  radius: number,
): OffsetInfo {
  const p10 = p0.subtract(p1);
  const p12 = p2.subtract(p1);
  const theta = p10.angleTo(p12);
  return new OffsetInfo(theta, radius / safeDenominator(Math.tan(0.5 * theta)));
}
function getRadiusOffsetInfoList(
  coordinates: Point[],
  raidusList: number[],
): OffsetInfo[] {
  const counts = coordinates.length;
  const thetaList = [];
  const fullOffsets = [];
  for (let i = 0; i < counts; i++) {
    const previous = coordinates[(i - 1 + counts) % counts];
    const current = coordinates[i];
    const next = coordinates[(i + 1) % counts];
    const info = getRadiusOffsetInfo(previous, current, next, raidusList[i]);
    thetaList.push(info.theta);
    fullOffsets.push([info.offset, info.offset]);
  }
  for (let i = 0; i < counts; i++) {
    const previous = coordinates[(i - 1 + counts) % counts];
    const current = coordinates[i];
    const next = coordinates[(i + 1) % counts];
    const previousOffsets = fullOffsets[(i - 1 + counts) % counts];
    const currentOffsets = fullOffsets[i];
    const nextOffsets = fullOffsets[(i + 1) % counts];
    const adjusted0 = adjust(
      previous,
      current,
      previousOffsets[1],
      currentOffsets[0],
    );
    const adjusted1 = adjust(current, next, currentOffsets[1], nextOffsets[0]);
    [previousOffsets[1], currentOffsets[0]] = adjusted0;
    [currentOffsets[1], nextOffsets[0]] = adjusted1;
  }
  const results = [];
  for (let i = 0; i < counts; i++) {
    const currentOffsets = fullOffsets[i];
    results.push(
      new OffsetInfo(
        thetaList[i],
        Math.min(currentOffsets[0], currentOffsets[1]),
      ),
    );
  }
  return results;
}
function arcToBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  radius: number,
  theta: number,
): Vertex {
  const l = (4.0 / 3.0) * radius * Math.tan(0.25 * theta);
  const p01 = p1.subtract(p0);
  const p32 = p2.subtract(p3);
  const l0 = p01.length;
  const l1 = p32.length;
  const p01r = p01.scale((l0 + l) / safeDenominator(l0));
  const p32r = p32.scale((l1 + l) / safeDenominator(l1));
  return new Vertex(p1, p0.add(p01r), p3.add(p32r), p2);
}

export function getVertices(
  coordinates: Point[],
  radius: number | number[],
  minOfWH: number,
  curveThreshold: number = 1.0e-5,
): Vertex[] {
  const radiusList = Array.isArray(radius) ? radius : coordinates.map(() => radius);
  const counts = coordinates.length;
  const infoList = getRadiusOffsetInfoList(coordinates, radiusList);
  const points = [];
  for (let i = 0; i < counts; i++) {
    const previous = coordinates[(i - 1 + counts) % counts];
    const current = coordinates[i];
    const next = coordinates[(i + 1) % counts];
    const info = infoList[i];
    const p01 = current.subtract(previous);
    const l01 = p01.length;
    const r01 = (l01 - info.offset) / safeDenominator(l01);
    const p1 = previous.add(p01.scale(r01));
    if (radiusList[i] / safeDenominator(minOfWH) <= curveThreshold) {
      points.push(new Vertex(p1));
    } else {
      const p21 = current.subtract(next);
      const l21 = p21.length;
      const r21 = (l21 - info.offset) / safeDenominator(l21);
      const p2 = next.add(p21.scale(r21));
      points.push(
        arcToBezier(previous, p1, p2, next, info.radius, Math.PI - info.theta),
      );
    }
  }
  return points;
}
