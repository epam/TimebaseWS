import {FieldTypeModel} from '../../../../../shared/models/schema.class.type.model';

export class SeFormPreferencesService {
  static defaultPreferType: FieldTypeModel = {
    name: 'FLOAT',
    encoding: 'DECIMAL64',
    nullable: true,
  };

  static preferType: FieldTypeModel = SeFormPreferencesService.defaultPreferType;
}
