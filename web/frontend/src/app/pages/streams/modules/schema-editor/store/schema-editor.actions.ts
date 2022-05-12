import {createAction, props} from '@ngrx/store';
import {
  DefaultTypeModel,
  SchemaClassFieldModel,
  SchemaClassTypeModel,
} from '../../../../../shared/models/schema.class.type.model';
import {StreamMetaDataChangeModel} from '../models/stream.meta.data.change.model';

export enum SchemaEditorActionTypes {
  GET_DEFAULT_TYPES = '[EditSchema] Get Default Types',
  SET_DEFAULT_TYPES = '[EditSchema] Set Default Types',

  GET_SCHEMA = '[EditSchema] Get Schema',
  SET_SCHEMA = '[EditSchema] Set Schema',
  SET_STREAM_ID = '[EditSchema] Set Stream Id',

  SET_SELECTED_SCHEMA_ITEM = '[EditSchema] Set Selected Schema Item',
  SET_SELECTED_FIELD_OF_SCHEMA_ITEM = '[EditSchema] Set Selected Field Of Schema Item',
  CHANGE_CLASS_NAME = '[EditSchema] Change Class Name',
  CHANGE_ENUM_NAME = '[EditSchema] Change Enum Name',
  // CHANGE_USED_STATE = '[EditSchema] Change Used State',
  CHANGE_SELECTED_SCHEMA_ITEM_PROPS = '[EditSchema] Change Schema Item Props',

  ADD_NEW_SCHEMA_ITEM = '[EditSchema] Add New Schema Item',
  REMOVE_SELECTED_SCHEMA_ITEM = '[EditSchema] Remove Selected Schema Item',
  ADD_NEW_FIELD_FOR_SELECTED_SCHEMA_ITEM = '[EditSchema] Add New Field For Selected Schema Item',
  REMOVE_SELECTED_SCHEMA_FIELD = '[EditSchema] Remove Selected Field',

  CHANGE_SELECTED_FIELD_PROPS = '[EditSchema] ChangeSelectedFieldProp',

  EDIT_SCHEMA_RESET_STATE = '[EditSchema] ResetState',
  EDIT_SCHEMA_UPDATE_STATE = '[EditSchema] UpdateState',

  GET_SCHEMA_DIFF = '[EditSchema] Get schema diff',
  SET_SCHEMA_DIFF = '[EditSchema] Set schema diff',
  ADD_CHANGED_VALUES = '[EditSchema] Set Add changed values',
  SAVE_SCHEMA_CHANGES = '[EditSchema] Save schema changes',
  REMOVE_SCHEMA_DIFF = '[EditSchema] Remove schema diff',
  CREATE_STREAM = '[EditSchema] Create Stream',
}

export const GetDefaultTypes = createAction(SchemaEditorActionTypes.GET_DEFAULT_TYPES);
export const SetDefaultTypes = createAction(
  SchemaEditorActionTypes.SET_DEFAULT_TYPES,
  props<{defaultTypes: DefaultTypeModel[]}>(),
);

export const GetSchema = createAction(SchemaEditorActionTypes.GET_SCHEMA);

export const SetSchema = createAction(
  SchemaEditorActionTypes.SET_SCHEMA,
  props<{schema: {types: SchemaClassTypeModel[]; all: SchemaClassTypeModel[]}}>(),
);

export const GetSchemaDiff = createAction(
  SchemaEditorActionTypes.GET_SCHEMA_DIFF /*, props<{ schema: { types: SchemaClassTypeModel[], all: SchemaClassTypeModel[] } }>()*/,
);
export const AddChangedValues = createAction(
  SchemaEditorActionTypes.ADD_CHANGED_VALUES,
  props<{groupName: string; name: string; value: any}>(),
);
export const SaveSchemaChanges = createAction(
  SchemaEditorActionTypes.SAVE_SCHEMA_CHANGES,
  props<{background: boolean; successAction?: () => void}>(),
);
export const SetSchemaDiff = createAction(
  SchemaEditorActionTypes.SET_SCHEMA_DIFF,
  props<{diff: StreamMetaDataChangeModel}>(),
);
export const RemoveSchemaDiff = createAction(
  SchemaEditorActionTypes.REMOVE_SCHEMA_DIFF /*, props<{ diff: StreamMetaDataChangeModel }>()*/,
);

export const CreateStream = createAction(
  SchemaEditorActionTypes.CREATE_STREAM,
  props<{key: string}>(),
);

export const SetStreamId = createAction(
  SchemaEditorActionTypes.SET_STREAM_ID,
  props<{streamId: string}>(),
);
export const SetSelectedSchemaItem = createAction(
  SchemaEditorActionTypes.SET_SELECTED_SCHEMA_ITEM,
  props<{itemName: string}>(),
);
export const SetSelectedFieldForSchemaItem = createAction(
  SchemaEditorActionTypes.SET_SELECTED_FIELD_OF_SCHEMA_ITEM,
  props<{fieldUuid: string}>(),
);

export const ChangeClassName = createAction(
  SchemaEditorActionTypes.CHANGE_CLASS_NAME,
  props<{classItem: SchemaClassTypeModel; newName: string}>(),
);

export const ChangeEnumName = createAction(
  SchemaEditorActionTypes.CHANGE_ENUM_NAME,
  props<{enumItem: SchemaClassTypeModel; newName: string}>(),
);

// export const ChangeUsedState = createAction(
//   SchemaEditorActionTypes.CHANGE_USED_STATE, props<{ typeItem: SchemaClassTypeViewModel, isUsed: boolean }>(),
// );

export const ChangeSchemaItem = createAction(
  SchemaEditorActionTypes.CHANGE_SELECTED_SCHEMA_ITEM_PROPS,
  props<{itemName: string; item: SchemaClassTypeModel}>(),
);

export const AddNewFieldForSelectedSchemaItem = createAction(
  SchemaEditorActionTypes.ADD_NEW_FIELD_FOR_SELECTED_SCHEMA_ITEM,
  props<{
    isStatic: boolean;
    name: string;
    value?: string;
  }>(),
);
export const ChangeSelectedFieldProps = createAction(
  SchemaEditorActionTypes.CHANGE_SELECTED_FIELD_PROPS,
  props<{
    uuid: string;
    newData: SchemaClassFieldModel;
    isSelected?: boolean;
  }>(),
);

export const AddNewSchemaItem = createAction(
  SchemaEditorActionTypes.ADD_NEW_SCHEMA_ITEM,
  props<{
    isEnum: boolean;
    name: string;
    title: string;
    isUsed?: boolean;
    parentName?: string;
  }>(),
);

export const RemoveSelectedSchemaItem = createAction(
  SchemaEditorActionTypes.REMOVE_SELECTED_SCHEMA_ITEM,
);
export const RemoveSelectedField = createAction(
  SchemaEditorActionTypes.REMOVE_SELECTED_SCHEMA_FIELD,
);
export const EditSchemaResetState = createAction(SchemaEditorActionTypes.EDIT_SCHEMA_RESET_STATE);

export const EditSchemaUpdateState = createAction(
  SchemaEditorActionTypes.EDIT_SCHEMA_UPDATE_STATE,
  props<{
    classes: SchemaClassTypeModel[];
    enums: SchemaClassTypeModel[];
  }>(),
);
