import {createFeatureSelector, createSelector} from '@ngrx/store';
import {
  SchemaClassFieldModel,
  SchemaClassTypeModel,
} from '../../../../../shared/models/schema.class.type.model';
import {getParentFields} from './schema-editor.helpers';
import * as fromEditSchema from './schema-editor.reducer';
import {schemaEditorFeatureKey, State} from './schema-editor.reducer';

export const getEditSchemaState = createFeatureSelector<State>(schemaEditorFeatureKey);

export const getStreamId = createSelector(
  getEditSchemaState,
  (state: fromEditSchema.State) => state.streamId,
);

export const getEnums = createSelector(
  getEditSchemaState,
  (state: fromEditSchema.State) => state.enums,
);

export const getSchemaDiff = createSelector(
  getEditSchemaState,
  (state: fromEditSchema.State) => state.diff,
);

export const getAllSchemaItems = createSelector(
  getEditSchemaState,
  (state: fromEditSchema.State) => [...state.enums, ...state.classes],
);

export const getAllClasses = createSelector(
  getEditSchemaState,
  (state: fromEditSchema.State) => state.classes,
);

export const getDefaultsTypes = createSelector(getEditSchemaState, (state: State) => {
  return state.defaultTypes;
});

export const getDDTypesNames = createSelector(getEditSchemaState, (state: State) => {
  return [
    ...state.defaultTypes.map((type) => type.name),
    ...state.enums.map((_enum) => _enum.name),
  ];
});

export const getDiffData = createSelector(getEditSchemaState, (state: State) => {
  return [state, state.streamId];
});

export const getSaveSchemaData = createSelector(getEditSchemaState, (state: State) => {
  return {
    schemaMapping: state.schemaMapping,
    classes: state.classes,
    enums: state.enums,
    defaultValues: state.newDefaultValues || {},
    streamId: state.streamId,
    dropValues: state.dropValues,
  };
});

export const getSelectedSchemaItem = createSelector(
  getAllSchemaItems,
  (allSchemaItems: SchemaClassTypeModel[]) =>
    allSchemaItems.find((schemaItem) => schemaItem._props && schemaItem._props._isSelected),
);

export const getSelectedSchemaItemFields = createSelector(
  getSelectedSchemaItem,
  (selectedSchemaItem: SchemaClassTypeModel) =>
    selectedSchemaItem ? selectedSchemaItem.fields : [],
);

export const getSelectedSchemaItemAllFields = createSelector(
  getSelectedSchemaItem,
  getSelectedSchemaItemFields,
  getAllSchemaItems,
  (
    selectedSchemaItem: SchemaClassTypeModel,
    selectedSchemaItemFields: SchemaClassFieldModel[],
    allSchemaItems: SchemaClassTypeModel[],
  ) => {
    return selectedSchemaItem
      ? selectedSchemaItem.isEnum
        ? [...selectedSchemaItemFields]
        : [
            ...getParentFields(
              selectedSchemaItem.parent,
              allSchemaItems.filter((_type) => !_type.isEnum),
            ),
            ...selectedSchemaItemFields,
          ]
      : [];
  },
);

export const getSelectedFieldProps = createSelector(
  getAllSchemaItems,
  (allSchemaItems: SchemaClassTypeModel[]): SchemaClassFieldModel | null => {
    const SELECTED_TYPE = allSchemaItems.find((_type) => _type?._props?._isSelected),
      SELECTED_TYPE_FIELDS = SELECTED_TYPE?.fields;

    return SELECTED_TYPE_FIELDS && SELECTED_TYPE_FIELDS.length
      ? SELECTED_TYPE_FIELDS.find(
          (field) => field._props._uuid === SELECTED_TYPE._props._selectedFieldUuid,
        )
      : null;
  },
);

export const ifNewFieldIsAdding = createSelector(
  getSelectedSchemaItem,
  getSelectedSchemaItemFields,
  (selectedSchemaItem: SchemaClassTypeModel, selectedSchemaItemFields: SchemaClassFieldModel[]) =>
    !selectedSchemaItem?.isEnum && selectedSchemaItemFields.length
      ? selectedSchemaItemFields.some((field) => !field.name)
      : false,
);

export const iSchemaItemsEdited = createSelector(
  getEditSchemaState,
  (state: fromEditSchema.State) => ({
    newClassAdding: state.newClassAdding,
    newEnumAdding: state.newEnumAdding,
  }),
);
