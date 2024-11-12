import { shallowCopy } from "./utils.ts";

export interface JsonSerializable<D> {
  toJsonData(): D;
  toJson(): string;
}
export interface JsonSerializableFactory<D, I extends JsonSerializable<D>> {
  fromJsonData(data: D): I;
  fromJson(json: string): I;
}

export abstract class JsonSerializableBase<
  D,
  F extends JsonSerializableFactory<D, JsonSerializable<D>> | null,
> implements JsonSerializable<D> {
  abstract get factory(): F;
  abstract toJsonData(): D;

  toJson(): string {
    return JSON.stringify(this.toJsonData());
  }
  snapshot(): this {
    if (!this.factory) {
      return new (this.constructor as new () => this)();
    }
    const data = shallowCopy(this.toJsonData());
    return this.factory.fromJsonData(data) as this;
  }
}
export abstract class JsonSerializableFactoryBase<
  D,
  I extends JsonSerializable<D>,
> implements JsonSerializableFactory<D, I> {
  abstract fromJsonData(data: D): I;

  fromJson(json: string): I {
    return this.fromJsonData(JSON.parse(json));
  }
}
