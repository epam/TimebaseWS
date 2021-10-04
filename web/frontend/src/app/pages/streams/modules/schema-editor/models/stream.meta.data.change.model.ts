import { SchemaClassFieldModel, SchemaClassTypeModel } from '../../../../../shared/models/schema.class.type.model';
import { SchemaMappingModel }                          from './schema.mapping.model';

export interface StreamMetaDataChangeModel {
  // changeImpact	Impact
  // sourceType	ContentType
  // targetType	ContentType
  // schemaMapping	SchemaMappingDef
  // changes	array of ClassDescriptorChangeDef

  changeImpact: 'None' | 'DataConvert' | 'DataLoss';
  sourceType: 'Polymorphic' | 'Fixed' | 'Mixed';
  targetType: 'Polymorphic' | 'Fixed' | 'Mixed';
  schemaMapping: SchemaMappingModel;
  changes: ClassDescriptorChangeModel[];
}

export interface ClassDescriptorChangeModel {
  // source	TypeDef
  // target	TypeDef
  // fieldChanges	array of FieldChangeWrapper
  // changeImpact	Impact

  source: SchemaClassTypeModel;
  target: SchemaClassTypeModel;
  fieldChanges: FieldChangeWrapperModel[];
  changeImpact: 'None' | 'DataConvert' | 'DataLoss';
}

export interface FieldChangeWrapperModel {
  // source	FieldDef
  // target	FieldDef
  // hasErrors	boolean	required
  // typeName	string
  // changeImpact	Impact
  defaultValue?: string;
  defaultValueRequired?: boolean;
  source: SchemaClassFieldModel;
  target: SchemaClassFieldModel;
  hasErrors: boolean;
  typeName: string;
  status: string;
  changeImpact: 'None' | 'DataConvert' | 'DataLoss';
}
