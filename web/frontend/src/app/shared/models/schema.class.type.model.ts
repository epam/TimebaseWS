export interface SchemaClassTypeModel {
  fields: SchemaClassFieldModel[];
  isEnum: boolean;
  isAbstract: boolean;
  name: string;
  parent: string;
  title: string;

  _props?: SchemaClassTypePropsModel;
}

export interface DefaultPropsModel {
  _isSelected?: boolean;
  _isEdited?: boolean;
  _isNew?: boolean;
}

export interface SchemaClassTypePropsModel extends DefaultPropsModel {
  _parentLvl?: number;
  _children?: string[];
  _isUsed?: boolean;
  _showChildren?: boolean;
  _isVisible?: boolean;
  _selectedFieldUuid?: string;
  _hierarchy?: string[];
  _uuid?: string;
}

export interface SchemaClassFieldModel {
  hide: boolean; // false
  name: string; // "contractId"
  // nullable: boolean; // true
  title: string; // "Contract ID"
  type: FieldTypeModel; // "VARCHAR (ALPHANUMERIC(10))"
  static: boolean;
  value?: string;
  _props?: SchemaClassFieldPropsModel;
}

export interface SchemaClassFieldPropsModel extends DefaultPropsModel {
  _parentField?: boolean;
  _parentName?: string;
  _typeName?: string;
  _uuid?: string;
  _isCurrentEdited?: boolean;
}

export interface FieldTypeModel extends DefaultTypeModel {
  types?: string[]; // null
  elementType?: FieldTypeModel; // null
}

export interface DefaultTypeModel {
  encoding: string;
  name: string;
  nullable: boolean;
  // types: null
}
