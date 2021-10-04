// import { ConnectorAttrElemType } from '../../helpers/connectors.helpers';

import { AsyncValidatorFn, FormControl, ValidatorFn } from '@angular/forms';
import { Observable }                                 from 'rxjs';

export class FieldModel {
  type: 'text' | 'number' | 'password' | 'array' | 'object' | 'dropdown' | 'multiselect' | 'checkbox' | 'radio' | 'file' | 'datetimepicker';
  name: string;
  label: string;
  value?: any;
  required?: boolean;
  default?: any;
  password?: boolean;
  readonly?: boolean;
  upload_file?: boolean;
  upload_file_info?: string;
  // multiline: boolean;
  values?: any[];
  description?: string;
  // elementType?: ConnectorAttrElemType;
  parentName?: string;
  childFields?: FieldModel[];
  disabled?: boolean;
  validators?: {
    getValidators?: () => ValidatorFn | ValidatorFn[] | null;
    getAsyncValidators?: () => AsyncValidatorFn | AsyncValidatorFn[] | null;
    getErrorsText: (control: FormControl | null) => Observable<string>;
  };
  _controlSpecOptions?: { [key: string]: any };
}

