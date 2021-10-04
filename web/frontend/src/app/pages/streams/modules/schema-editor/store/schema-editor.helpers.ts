import { SchemaClassFieldModel, SchemaClassTypeModel } from '../../../../../shared/models/schema.class.type.model';

export function getParentFields(currentClassName: string, allClasses: SchemaClassTypeModel[]): SchemaClassFieldModel[] {
  const PARENT = allClasses.find(_class => _class.name === currentClassName);
  if (PARENT) {
    return [...getParentFields(PARENT.parent, allClasses), ...PARENT.fields.map(field => ({
      ...field,
      _props: {
        _parentField: true,
        _parentName: currentClassName,
      },
    }))];
  } else {
    return [];
  }
}
