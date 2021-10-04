import { Action, createReducer, on } from '@ngrx/store';
import {
  DefaultTypeModel,
  SchemaClassFieldModel,
  SchemaClassTypeModel,
}                                    from '../../../../../shared/models/schema.class.type.model';
import { SchemaMappingModel }        from '../models/schema.mapping.model';
import { StreamMetaDataChangeModel } from '../models/stream.meta.data.change.model';
import { SeFormPreferencesService }  from '../services/se-form-preferences.service';
import { EditSchemaUpdateState }     from './schema-editor.actions';
import * as SchemaEditorActions      from './schema-editor.actions';
import { uuid }                      from '../../../../../shared/utils/uuid';

export const schemaEditorFeatureKey = 'schemaEditor';

export interface State {
  streamId: string;
  classes: SchemaClassTypeModel[];
  enums: SchemaClassTypeModel[];
  newClassAdding: boolean;
  newEnumAdding: boolean;
  defaultTypes: DefaultTypeModel[];
  _isEdited: boolean;
  schemaMapping: SchemaMappingModel;
  diff: StreamMetaDataChangeModel;
  newDefaultValues: { [key: string]: { [key: string]: {} } };
  dropValues: { [key: string]: string[] };
}

const defaultState: State = {
  streamId: null,
  classes: [],
  enums: [],
  newClassAdding: false,
  newEnumAdding: false,
  defaultTypes: [],
  _isEdited: false,
  schemaMapping: {
    descriptors: {},
    fields: [],
    enumValues: [],
  },
  diff: null,
  newDefaultValues: null,
  dropValues: null,
};

export const initialState: State = {...defaultState};

const getSortedSchema = ({types, all}: { types: SchemaClassTypeModel[], all: SchemaClassTypeModel[] }): {
  classes: SchemaClassTypeModel[];
  enums: SchemaClassTypeModel[];
} => {
  let typesList: SchemaClassTypeModel[] = [];
  const ENUMS = all.filter(type => type.isEnum).map(type => ({...type, _props: {_uuid: type.name}})),
    getChildren = (parent: SchemaClassTypeModel, all: SchemaClassTypeModel[]) => {
      let retArray = [parent];
      const PROPS = parent._props;
      if (PROPS && PROPS._children && PROPS._children.length) {
        PROPS._children.forEach(childName => {
          let newRArray;
          [all, newRArray] = getChildren(all.find(type => type.name === childName), all);
          retArray = [...retArray, ...newRArray];
        });
      }
      return [all.filter(type => type.name !== parent.name), retArray];
    };
  
  all.reverse();
  
  for (let i = 0; i < all.length; i++) {
    const TYPE = all[i];
    const CHILDREN = all.filter(childrenTypes => childrenTypes.parent === TYPE.name);
    TYPE._props = TYPE._props || {_uuid: TYPE.name};
    if (CHILDREN && CHILDREN.length) {
      TYPE._props._children = CHILDREN.map(childrenTypes => childrenTypes.name).reverse();
      TYPE._props._showChildren = true;
    }
    if (TYPE.fields && TYPE.fields.length) {
      TYPE.fields.forEach((field, index) => {
        TYPE.fields[index]._props = {
          ...(TYPE.fields[index]._props || {}),
          _typeName: TYPE.name,
          _uuid: `${TYPE.name}:${TYPE.fields[index].name}`,
        };
      });
    }
  }
  
  if (types && types.length) {
    types.forEach(type => {
      const CURRENT_TYPE = all.find(allType => allType.name === type.name);
      if (CURRENT_TYPE) {
        CURRENT_TYPE._props = {
          ...(CURRENT_TYPE._props || {}),
          _isUsed: true,
        };
      }
    });
  }
  
  while (all && all.length) {
    const TOP_PARENT = all.find(type => !type.parent);
    if (TOP_PARENT) {
      let newTypes;
      [all, newTypes] = getChildren(TOP_PARENT, all);
      typesList = [...typesList, ...newTypes];
    } else {
      break;
    }
  }

  return {
    classes: typesList.filter(type => !type.isEnum),
    enums: ENUMS,
  };
};

const getDropValues = (diff: StreamMetaDataChangeModel): { [key: string]: string[] } | null => {
  const DROP_VALUES = {};
  diff.changes.forEach(change => {
    const CHANGE_SOURCE = change.target || change.source;
    if (change.changeImpact === 'DataLoss') {
      DROP_VALUES[CHANGE_SOURCE.name] = change.fieldChanges
        .filter(field => field.changeImpact === 'DataLoss')
        .map(field => (field.target || field.source).name);
    }
  });
  return Object.keys(DROP_VALUES).length ? DROP_VALUES : null;
};

const schemaEditorReducer = createReducer(
  initialState,
  on(SchemaEditorActions.SetStreamId, (state, {streamId}) => ({...state, streamId})),
  on(SchemaEditorActions.SetSchema, (state, {schema}) => ({...state, ...(getSortedSchema(schema))})),
  on(SchemaEditorActions.SetSchemaDiff, (state, {diff}) => ({...state, diff, dropValues: getDropValues(diff)})),
  on(SchemaEditorActions.RemoveSchemaDiff, (state) => ({...state, diff: null, dropValues: null})),
  on(SchemaEditorActions.SetDefaultTypes, (state, {defaultTypes}) => ({...state, defaultTypes: defaultTypes})),
  on(SchemaEditorActions.SetSelectedSchemaItem, (state, {itemName}) => {
    const CLASSES = [...state.classes].map(type => ({
        ...type,
        _props: {
          ...type._props,
          _isSelected: false,
          _selectedFieldUuid: null,
        },
        fields: type.fields ? type.fields
          .map(field => ({
            ...field,
            _props: field._props ? {
              ...field._props,
              _isSelected: false,
            } : field._props,
          })) : type.fields,
      })),
      ENUMS = [...state.enums].map(type => ({
        ...type,
        _props: {
          ...type._props,
          _isSelected: false,
          _selectedFieldUuid: null,
        },
        fields: type.fields ? type.fields
          .map(field => ({
            ...field,
            _props: field._props ? {
              ...field._props,
              _isSelected: false,
            } : field._props,
          })) : type.fields,
      })),
      SELECTED_ITEM = [...CLASSES, ...ENUMS].find(type => type.name === itemName);
    
    if (SELECTED_ITEM) {
      const TYPES = SELECTED_ITEM.isEnum ? [...ENUMS] : [...CLASSES],
        SELECTED_ITEM_IDX = TYPES.findIndex(type => type.name === itemName);
      if (SELECTED_ITEM_IDX >= 0) {
        TYPES[SELECTED_ITEM_IDX] = {
          ...TYPES[SELECTED_ITEM_IDX],
          _props: {
            ...TYPES[SELECTED_ITEM_IDX]._props,
            _isSelected: true,
          },
        };
      }
      return {
        ...state,
        ...(SELECTED_ITEM.isEnum ? {
          enums: TYPES,
          classes: CLASSES,
        } : {
          enums: ENUMS,
          classes: TYPES,
        }),
      };
    }
    return state;
  }),
  on(SchemaEditorActions.ChangeClassName, (state, {classItem, newName}) => {
    const NEW_CLASSES: SchemaClassTypeModel[] = [...state.classes],
      ITEM_IDX = NEW_CLASSES.findIndex(type => type.name === classItem.name),
      schemaMapping = {...state.schemaMapping};
    
    let originalName = classItem.name;
    
    if (Object.keys(schemaMapping.descriptors).length) {
      const DESCRIPTORS = Object.keys(schemaMapping.descriptors).map(key => ({
        originalName: key,
        changedName: schemaMapping.descriptors[key],
      }));
      if (DESCRIPTORS.some(descriptor => descriptor.changedName === classItem.name)) {
        const CURRENT_DESCRIPTOR = DESCRIPTORS.find(descriptor => descriptor.changedName === classItem.name);
        originalName = CURRENT_DESCRIPTOR.originalName;
      }
    }
    
    if (newName !== originalName) {
      if (!(classItem._props && classItem._props._isNew)) {
        schemaMapping.descriptors[originalName] = newName;
        if (schemaMapping.fields.length && schemaMapping.fields.some(field => field.sourceTypeName === originalName)) {
          const FIELD_INDEX = schemaMapping.fields.findIndex(field => field.sourceTypeName === originalName);
          schemaMapping.fields.splice(FIELD_INDEX, 1, {
            ...schemaMapping.fields[FIELD_INDEX],
            targetTypeName: newName,
          });
        }
        
        if (classItem.fields && classItem.fields.length) {
          classItem.fields.forEach((field, index) => {
            classItem.fields[index] = {
              ...classItem.fields[index],
              _props: {
                ...classItem.fields[index]._props,
                _typeName: newName,
              },
            };
          });
        }
      }
      NEW_CLASSES.forEach(_class => {
        if (_class.fields && _class.fields.length) {
          _class.fields.forEach(_field => {
            if (_field.type && _field.type.name && _field.type.name === classItem.name) {
              _field.type.name = newName;
            }
          });
        }
      });
    }
    
    if (classItem._props._children && classItem._props._children.length) {
      classItem._props._children.forEach(childName => {
        const CHILD_IDX = NEW_CLASSES.findIndex(type => type.name === childName);
        if (CHILD_IDX > -1) {
          NEW_CLASSES.splice(CHILD_IDX, 1, {
            ...NEW_CLASSES[CHILD_IDX],
            parent: newName,
          });
        }
      });
    }
    if (classItem.parent) {
      const PARENT_IDX = NEW_CLASSES.findIndex(type => type.name === classItem.parent);
      if (PARENT_IDX >= 0) {
        const PARENT = {...NEW_CLASSES[PARENT_IDX]};
        PARENT._props._children = PARENT._props._children.map(childName => {
          if (childName === classItem.name) {
            return newName;
          }
          return childName;
        });
        NEW_CLASSES.splice(PARENT_IDX, 1, PARENT);
      }
    }
    NEW_CLASSES.splice(ITEM_IDX, 1, {
      ...NEW_CLASSES[ITEM_IDX],
      name: newName,
      _props: {
        ...NEW_CLASSES[ITEM_IDX]._props,
        _isEdited: true,
      },
    });
    
    return {
      ...state,
      _isEdited: true,
      classes: NEW_CLASSES,
      newClassAdding: NEW_CLASSES.some(type => !type.name || !type.name.length),
      schemaMapping,
    };
  }),
  on(SchemaEditorActions.ChangeEnumName, (state, {enumItem, newName}) => {
    const NEW_ENUMS: SchemaClassTypeModel[] = [...state.enums],
      ITEM_IDX = NEW_ENUMS.findIndex(type => type.name === enumItem.name),
      schemaMapping = {...state.schemaMapping};
    
    let originalName = enumItem.name,
      ifNewClasses = false;
    const classes: SchemaClassTypeModel[] = [...state.classes];
    
    NEW_ENUMS.splice(ITEM_IDX, 1, {
      ...NEW_ENUMS[ITEM_IDX],
      name: newName,
      _props: {
        ...NEW_ENUMS[ITEM_IDX]._props,
        _isEdited: true,
      },
    });
    
    if (Object.keys(schemaMapping.descriptors).length) {
      const DESCRIPTORS = Object.keys(schemaMapping.descriptors).map(key => ({
        originalName: key,
        changedName: schemaMapping.descriptors[key],
      }));
      if (DESCRIPTORS.some(descriptor => descriptor.changedName === enumItem.name)) {
        const CURRENT_DESCRIPTOR = DESCRIPTORS.find(descriptor => descriptor.changedName === enumItem.name);
        originalName = CURRENT_DESCRIPTOR.originalName;
      }
    }
    
    if (newName !== originalName) {
      if (!(enumItem._props && enumItem._props._isNew)) {
        schemaMapping.descriptors[originalName] = newName;
        if (schemaMapping.fields.length && schemaMapping.fields.some(field => field.sourceTypeName === originalName)) {
          const FIELD_INDEX = schemaMapping.fields.findIndex(field => field.sourceTypeName === originalName);
          schemaMapping.fields = [...schemaMapping.fields].splice(FIELD_INDEX, 1, {
            ...schemaMapping.fields[FIELD_INDEX],
            targetTypeName: newName,
          });
        }
        
        if (enumItem.fields && enumItem.fields.length) {
          enumItem.fields.forEach((field, index) => {
            enumItem.fields[index]._props = {
              ...(enumItem.fields[index]._props || {}),
              _typeName: enumItem.name,
            };
          });
        }
      }
      classes.forEach(_class => {
        if (_class.fields && _class.fields.length) {
          _class.fields.forEach(_field => {
            if (_field.type && _field.type.name && _field.type.name === enumItem.name) {
              _field.type.name = newName;
              ifNewClasses = true;
            }
          });
        }
      });
    }
    
    
    return {
      ...state,
      _isEdited: true,
      enums: NEW_ENUMS,
      newEnumAdding: NEW_ENUMS.some(type => !type.name || !type.name.length),
      schemaMapping,
      ...(ifNewClasses ? {classes} : {}),
    };
  }),
  on(SchemaEditorActions.ChangeSchemaItem, (state, {itemName, item}) => {
    const CLASSES = [...state.classes],
      ENUMS = [...state.enums],
      CURRENT_ITEM = [...CLASSES, ...ENUMS].find(type => type.name === itemName);
    if (CURRENT_ITEM) {
      const TYPES = CURRENT_ITEM.isEnum ? [...ENUMS] : [...CLASSES],
        CURRENT_ITEM_IDX = TYPES.findIndex(type => type.name === itemName);
      if (CURRENT_ITEM_IDX >= 0) {
        TYPES[CURRENT_ITEM_IDX] = {
          ...TYPES[CURRENT_ITEM_IDX],
          ...item,
          _props: {
            ...TYPES[CURRENT_ITEM_IDX]._props,
            ...item._props,
            _isEdited: true,
          },
        };
      }
      
      return {
        ...state,
        _isEdited: true,
        ...(CURRENT_ITEM.isEnum ? {
          enums: TYPES,
          classes: CLASSES,
        } : {
          enums: ENUMS,
          classes: TYPES,
        }),
      };
    }
    return state;
  }),
  on(SchemaEditorActions.AddNewFieldForSelectedSchemaItem, (state, {isStatic, name, value}) => {
    const CLASSES = [...state.classes],
      ENUMS = [...state.enums],
      SELECTED_ITEM = [...CLASSES, ...ENUMS].find(type => type._props && type._props._isSelected);
    const TYPES = SELECTED_ITEM.isEnum ? [...ENUMS] : [...CLASSES];
    
    if (SELECTED_ITEM) {
      const SELECTED_ITEM_IDX = TYPES.findIndex(type => type._props && type._props._isSelected);
      
      SELECTED_ITEM.fields.forEach(field => {
        field._props = {
          ...field._props,
          _isSelected: false,
        };
      });
      const NEW_FIELD: SchemaClassFieldModel = {
        hide: false,
        name: name,
        title: '',
        static: !!isStatic,
        type: SeFormPreferencesService.preferType,
        _props: {
          _isEdited: true,
          _isSelected: true,
          _isNew: true,
          _typeName: SELECTED_ITEM.name,
          _uuid: uuid(),
        },
      };
      if (isStatic && value) {
        NEW_FIELD.value = value;
      }
      
      TYPES.splice(SELECTED_ITEM_IDX, 1, {
        ...SELECTED_ITEM,
        fields: [
          ...SELECTED_ITEM.fields,
          NEW_FIELD,
        ],
        _props: {
          ...SELECTED_ITEM._props,
          _selectedFieldUuid: NEW_FIELD._props._uuid,
        },
      });
      
      return SELECTED_ITEM.isEnum ? {
        ...state,
        _isEdited: true,
        enums: TYPES,
        // classes: CLASSES,
      } : {
        _isEdited: true,
        ...state,
        classes: TYPES,
      };
    }
    return state;
  }),
  on(SchemaEditorActions.SetSelectedFieldForSchemaItem, (state, {fieldUuid}) => {
    state.classes.forEach(type => {
      if (type._props) {
        delete type._props._selectedFieldUuid;
      }
    });
    state.enums.forEach(type => {
      if (type._props) {
        delete type._props._selectedFieldUuid;
      }
    });
    
    const CLASSES = state.classes,
      ENUMS = state.enums,
      SELECTED_ITEM = [...CLASSES, ...ENUMS].find(type => type._props && type._props._isSelected);
    const TYPES = SELECTED_ITEM.isEnum ? ENUMS : CLASSES;
    
    if (SELECTED_ITEM) {
      const SELECTED_ITEM_IDX = TYPES.findIndex(type => type._props && type._props._isSelected);
      TYPES[SELECTED_ITEM_IDX]._props._selectedFieldUuid = fieldUuid;
      const SELECTED_FIELD_INDEX = TYPES[SELECTED_ITEM_IDX].fields.findIndex(field => field._props._uuid === fieldUuid),
        SELECTED_FIELD: SchemaClassFieldModel = TYPES[SELECTED_ITEM_IDX].fields[SELECTED_FIELD_INDEX];
      
      SELECTED_ITEM.fields.forEach(field => {
        field._props = {
          ...field._props,
          _isSelected: false,
          _isCurrentEdited: false,
        };
      });
      
      TYPES[SELECTED_ITEM_IDX].fields.splice(SELECTED_FIELD_INDEX, 1, {
        ...SELECTED_FIELD,
        _props: {
          ...SELECTED_FIELD._props,
          _isSelected: true,
        },
      });
      
      return SELECTED_ITEM.isEnum ? {
        ...state,
        enums: [...TYPES],
        classes: CLASSES,
      } : {
        ...state,
        enums: ENUMS,
        classes: [...TYPES],
      };
    }
    return state;
  }),
  on(SchemaEditorActions.RemoveSelectedField, (state) => {
    const CLASSES = [...state.classes],
      ENUMS = [...state.enums],
      SELECTED_ITEM = [...CLASSES, ...ENUMS].find(type => type._props && type._props._isSelected);
    const TYPES = SELECTED_ITEM.isEnum ? [...ENUMS] : [...CLASSES];
    
    if (SELECTED_ITEM && SELECTED_ITEM._props && typeof SELECTED_ITEM._props._selectedFieldUuid === 'string') {
      const SELECTED_ITEM_IDX = TYPES.findIndex(type => type._props && type._props._isSelected),
        SELECTED_FIELD_IDX = SELECTED_ITEM.fields.findIndex(field => field._props._uuid === SELECTED_ITEM._props._selectedFieldUuid);
      if (SELECTED_FIELD_IDX >= 0) {
        const NEW_PROPS = {...SELECTED_ITEM._props};
        delete NEW_PROPS._selectedFieldUuid;
        SELECTED_ITEM.fields.splice(SELECTED_FIELD_IDX, 1);
        TYPES.splice(SELECTED_ITEM_IDX, 1, {
          ...SELECTED_ITEM,
          fields: [...SELECTED_ITEM.fields],
          _props: NEW_PROPS,
        });
      }
      
      return SELECTED_ITEM.isEnum ? {
        ...state,
        _isEdited: true,
        enums: TYPES,
        // classes: CLASSES,
      } : {
        ...state,
        _isEdited: true,
        classes: TYPES,
      };
    }
    return state;
  }),
  on(SchemaEditorActions.ChangeSelectedFieldProps, (state, {uuid, newData}) => {
    let fieldIndex: number;
    let typeIndex: number;
    let updateKey: 'enums' | 'classes';
    [state.classes, state.enums].some((types, index) => types.some((type, currentTypeIndex) => {
      return type.fields.some((field, currentFieldIndex) => {
        if (field._props._uuid === uuid) {
          fieldIndex = currentFieldIndex;
          typeIndex = currentTypeIndex;
          updateKey = index === 1 ? 'enums' : 'classes';
          return true;
        }
        
        return false;
      });
    }));
    
    const stateCopy = JSON.parse(JSON.stringify(state));
    const type = stateCopy[updateKey][typeIndex];
    let field = type.fields[fieldIndex];
    const oldName = field.name;
    
    const enumAttributes = {
      hide: false,
      static: false,
      title: newData.name,
      type: {
        encoding: null,
        nullable: false,
        name: 'ENUM',
      },
    };
    
    field = {
      ...field,
      ...newData,
      ...(updateKey === 'enums' ? enumAttributes : {}),
      targetName: newData.name,
      _props: {
        ...field._props,
        ...newData._props,
        _isSelected: true,
      },
    };
    
    type._props._selectedFieldUuid = field._props._uuid;
    type._isSelected = true;
    
    // Change name on not new entry puts entry to schemaMapping
    if (!field._props._isNew && oldName !== field.name) {
      const sourceName = field._props._uuid.split(':')[1];
      let entryIndex = stateCopy.schemaMapping.fields.findIndex(e => {
        return e.sourceName === sourceName && e.sourceTypeName === type._props._uuid;
      });
      
      if (sourceName !== field.name) {
        const mappingEntry = {
          sourceName,
          targetName: field.name,
          sourceTypeName: type._props._uuid,
          targetTypeName: type.name,
        };
        
        entryIndex = entryIndex > -1 ? entryIndex : stateCopy.schemaMapping.fields.length;
        stateCopy.schemaMapping.fields[entryIndex] = mappingEntry;
      } else if (entryIndex > -1) {
        stateCopy.schemaMapping.fields.splice(entryIndex, 1);
      }
    }
    
    type.fields[fieldIndex] = field;
    return stateCopy;
  }),
  on(SchemaEditorActions.AddNewSchemaItem, (state, {isEnum, name, title, isUsed, parentName}) => {
    const CLASSES = [...state.classes],
      ENUMS = [...state.enums],
      PARENT_ITEM = [...CLASSES, ...ENUMS].find(type => type.name === parentName);
    
    const TYPES = isEnum ? [...ENUMS] : [...CLASSES];
    let selectedItemIndex = TYPES.length;
    if (PARENT_ITEM && PARENT_ITEM.isEnum === isEnum) {
      selectedItemIndex = TYPES.findIndex(type => type.name === PARENT_ITEM.name);
      parentName = PARENT_ITEM.name;
      
      TYPES.splice(selectedItemIndex, 1, ...[
        {
          ...PARENT_ITEM,
          _props: isEnum ? PARENT_ITEM._props : {
            ...PARENT_ITEM._props,
            _children: PARENT_ITEM._props._children ? [...PARENT_ITEM._props._children, name] : [name],
            _showChildren: true,
          },
        },
        {
          isEnum: isEnum,
          isAbstract: false,
          name: name || '',
          fields: [],
          parent: parentName,
          title: title,
          _props: {
            _isEdited: true,
            _isNew: true,
            _uuid: uuid(),
            ...(isEnum ? {} : {_isUsed: isUsed}),
          },
        },
      ]);
    } else {
      TYPES.splice(selectedItemIndex, 0, {
        isEnum: isEnum,
        isAbstract: false,
        name: name || '',
        fields: [],
        parent: parentName,
        title: title,
        _props: {
          _isEdited: true,
          _isNew: true,
          _uuid: uuid(),
          ...(isEnum ? {} : {_isUsed: isUsed}),
        },
      });
    }
    
    
    return {
      ...state,
      _isEdited: true,
      ...(isEnum ? {
        enums: TYPES,
        classes: CLASSES,
        newEnumAdding: TYPES.some(type => !type.name || !type.name.length),
      } : {
        enums: ENUMS,
        classes: TYPES,
        newClassAdding: TYPES.some(type => !type.name || !type.name.length),
      }),
    };
  }),
  on(SchemaEditorActions.RemoveSelectedSchemaItem, (state) => {
    const CLASSES = [...state.classes],
      ENUMS = [...state.enums],
      SELECTED_ITEM = [...CLASSES, ...ENUMS].find(type => type._props && type._props._isSelected);
    
    if (SELECTED_ITEM) {
      let TYPES = SELECTED_ITEM.isEnum ? [...ENUMS] : [...CLASSES];
      
      if (SELECTED_ITEM.parent) {
        const PARENT_INDEX = TYPES.findIndex(type => type.name === SELECTED_ITEM.parent);
        TYPES[PARENT_INDEX] = {
          ...TYPES[PARENT_INDEX],
          _props: {
            ...TYPES[PARENT_INDEX]._props,
            _children: TYPES[PARENT_INDEX]._props._children.filter(name => name !== SELECTED_ITEM.name),
          },
        };
      }
      
      const NAMES_TO_DELETE = [SELECTED_ITEM.name];
      const COLLECT_NAMES_TO_DELETE = (typeName) => {
        const TYPE_ITEM = TYPES.find(type => type.name === typeName);
        if (TYPE_ITEM && TYPE_ITEM._props && TYPE_ITEM._props._children) {
          NAMES_TO_DELETE.push(...TYPE_ITEM._props._children);
          TYPE_ITEM._props._children.forEach(name => {
            COLLECT_NAMES_TO_DELETE(name);
          });
        }
      };
      COLLECT_NAMES_TO_DELETE(SELECTED_ITEM.name);
      TYPES = TYPES.filter(type => !NAMES_TO_DELETE.includes(type.name));
      
      return {
        ...state,
        _isEdited: true,
        ...(SELECTED_ITEM.isEnum ? {
          enums: TYPES,
          classes: CLASSES,
          newEnumAdding: TYPES.some(type => !type.name || !type.name.length),
        } : {
          enums: ENUMS,
          classes: TYPES,
          newClassAdding: TYPES.some(type => !type.name || !type.name.length),
        }),
      };
    }
    return state;
  }),
  on(SchemaEditorActions.AddChangedValues, (state, {groupName, name, value}) => {
    const DEF_VALUES = state.newDefaultValues || {},
      DROP_VALUES = state.dropValues || {};
    if (value === undefined && DEF_VALUES[groupName]) {
      if (Object.keys(DEF_VALUES[groupName]).length > 1) {
        delete DEF_VALUES[groupName][name];
      } else {
        delete DEF_VALUES[groupName];
      }
      if (!DROP_VALUES[groupName]) {
        DROP_VALUES[groupName] = [name];
      } else if (!DROP_VALUES[groupName].some(fieldName => fieldName === name)) {
        DROP_VALUES[groupName].push(name);
      }
    } else {
      if (DROP_VALUES[groupName]) {
        DROP_VALUES[groupName] = DROP_VALUES[groupName].filter(fieldName => fieldName !== name);
        if (!DROP_VALUES[groupName].length) {
          delete DROP_VALUES[groupName];
        }
      }
      if (!DEF_VALUES[groupName]) {
        DEF_VALUES[groupName] = {};
      }
      DEF_VALUES[groupName][name] = value;
    }
    return {
      ...state,
      newDefaultValues: Object.keys(DEF_VALUES).length ? DEF_VALUES : null,
      dropValues: Object.keys(DROP_VALUES).length ? DROP_VALUES : null,
    };
  }),
  on(SchemaEditorActions.EditSchemaResetState, (state) => {
    return {
      ...defaultState,
      defaultTypes: state.defaultTypes,
    };
  }),
  on(SchemaEditorActions.EditSchemaUpdateState, (state, {classes, enums}) => {
    return {
      ...state,
      classes,
      enums,
      newClassAdding: false,
      newEnumAdding: false,
      _isEdited: true,
      schemaMapping: {
        descriptors: {},
        fields: [],
        enumValues: [],
      },
      diff: null,
      newDefaultValues: {},
      dropValues: {},
    };
  }),
);

export function reducer(state: State | undefined, action: Action) {
  return schemaEditorReducer(state, action);
}
