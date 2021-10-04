export interface SchemaMappingModel {
  descriptors: {[key: string]: string};
  fields: FieldMappingModel[];
  enumValues: FieldMappingModel[];
}

export interface FieldMappingModel {
  sourceName: string;
  sourceTypeName: string;
  targetName: string;
  targetTypeName: string;
}
