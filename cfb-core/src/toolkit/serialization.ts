import { shallowCopy } from "./utils.ts";

export interface JsonSerializable<D> {
  toJsonData(): D;
  toJson(): string;
}
export interface JsonSerializableStatic<D, I extends JsonSerializable<D>> {
  fromJsonData(data: D): I;
  fromJson(json: string): I;
}

export abstract class JsonSerializableBase<
  D,
  F extends JsonSerializableStatic<D, JsonSerializable<D>>,
> implements JsonSerializable<D> {
  abstract get factory(): F;
  abstract toJsonData(): D;

  toJson(): string {
    return JSON.stringify(this.toJsonData());
  }
  snapshot(): this {
    const data = shallowCopy(this.toJsonData());
    return this.factory.fromJsonData(data) as this;
  }
}
