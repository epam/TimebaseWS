// import { ConnectorAttrElemType } from '../../helpers/connectors.helpers';

import {AsyncValidatorFn, UntypedFormControl, ValidatorFn} from '@angular/forms';
import {Observable} from 'rxjs';

export class FieldModel {
  type:
    | 'text'
    | 'binary'
    | 'number'
    | 'password'
    | 'array'
    | 'object'
    | 'dropdown'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'datetimepicker'
    | 'btn-timepicker'
    | 'json'
    | 'autocomplete';
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
    getErrorsText: (control: UntypedFormControl | null) => Observable<string>;
  };
  _controlSpecOptions?: {[key: string]: any};
}
