export interface JsonSerializable<D> {
  toJsonData(): D;
  toJson(): string;
}
export interface JsonSerializableStatic<D, I extends JsonSerializable<D>> {
  fromJsonData(data: D): I;
  fromJson(json: string): I;
}
