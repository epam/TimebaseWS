import {FieldTypeModel} from './schema.class.type.model';

export interface SchemaTypeModel {
  name: string;
  title: string;
  type?: FieldTypeModel;
  nullable?: boolean;
  fields?: SchemaTypeModel[];
  hide?: boolean;
  parent?: string;
}

export interface SchemaAllTypeModel {
  isEnum: boolean;
  name: string;
  parent: string;
  title: string;
  fields: SchemaTypeModel[];
}

export type SchemaTypesMap = Map<
  string,
  {
    fields: Set<string>;
    parent: string;
  }
>;
