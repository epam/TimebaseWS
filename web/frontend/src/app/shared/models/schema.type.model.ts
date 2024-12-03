import {FieldTypeModel} from './schema.class.type.model';

export interface SchemaTypeModel {
  name: string;
  title: string;
  type?: FieldTypeModel;
  nullable?: boolean;
  fields?: SchemaTypeModel[];
  hide?: boolean;
  parent?: string;
  static?: boolean;
  value?: string | number | boolean;
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

export interface UISchemaTypeModel extends SchemaTypeModel {
  checked: boolean;
}

export interface UISchemaAllTypeModel extends SchemaAllTypeModel {
  hierarchy: string[], 
  fieldsOpen: boolean, 
  checked: boolean;
  fieldList: UISchemaTypeModel[];
}
