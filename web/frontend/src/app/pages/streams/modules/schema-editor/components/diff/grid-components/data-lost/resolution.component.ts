import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup }          from '@angular/forms';
import { select, Store }                   from '@ngrx/store';
import { TranslateService }                from '@ngx-translate/core';
import { ICellRendererAngularComp }        from 'ag-grid-angular';
import { ICellRendererParams }             from 'ag-grid-community';
import { Subject }                         from 'rxjs';
import { take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { AppState }                        from '../../../../../../../../core/store';
import { SchemaClassTypeModel }            from '../../../../../../../../shared/models/schema.class.type.model';
import { DynamicFormBuilderComponent }     from '../../../../../../../../shared/utils/dynamic-form-builder/dynamic-form-builder.component';
import { FieldModel }                      from '../../../../../../../../shared/utils/dynamic-form-builder/field-builder/field-model';
import { AddChangedValues }                from '../../../../store/schema-editor.actions';
import { getDDTypesNames, getEnums }       from '../../../../store/schema-editor.selectors';
import { GridRowDataModel }                from '../../grid/grid.component';

@Component({
  selector: 'app-diff-grid-resolution',
  templateUrl: './resolution.component.html',
  styleUrls: ['./resolution.component.scss'],
})
export class ResolutionComponent implements ICellRendererAngularComp, OnDestroy {
  private destroy$ = new Subject();
  public inputState: {
    available: boolean;
    value?: null;
  } = {
    available: false,
  };
  public data: GridRowDataModel;

  @ViewChild('formBuilder', {
    read: DynamicFormBuilderComponent,
  }) private formBuilder: DynamicFormBuilderComponent;
  public dataForm: FormGroup;
  public fields: FieldModel[] = [];
  public isNewForm: boolean;
  public defaultValueForm: FormGroup;
  private last_field_data;

  private storeData: {
    enums: SchemaClassTypeModel[];
    messages: { [key: string]: string };
    typesNames: string[];
  };

  constructor(
    private appStore: Store<AppState>,
    private fb: FormBuilder,
    private translate: TranslateService,
  ) { }

  agInit(params: ICellRendererParams): void {
    this.data = params.data;
    this.appStore
      .pipe(
        select(getEnums),
        withLatestFrom(this.translate.get('forms.resolution')),
        withLatestFrom(this.appStore.pipe(select(getDDTypesNames))),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(([[enums, messages], typesNames]) => {
        this.storeData = {
          enums,
          messages,
          typesNames,
        };
        this.generateForm();
      });

  }

  private generateForm(formValues?) {
    if (!this.storeData) {
      return;
    }
    if (this.ifDataLoss()) {
      this.fields = [
        {
          type: 'checkbox',
          name: 'drop',
          label: this.storeData.messages.drop,
          value: formValues ? formValues.drop : true,
          required: false,
          default: null,
        },
        this.getInputControl(!!(formValues ? formValues.drop : true)),
      ];
      this.last_field_data = {
        drop: formValues ? formValues.drop : true,
        setVal: '',
      };

    }
    if (this.ifDefaultValueRequired()) {
      this.fields = [this.getInputControl()];

    }
  }

  private getInputControl(disabled?: boolean): FieldModel {
    const CONTROL: FieldModel = {
        type: 'text',
        name: 'setVal',
        label: this.ifDataLoss() ? this.storeData.messages.setVal : this.ifDefaultValueRequired() ? this.storeData.messages.defVal : this.storeData.messages.val,
        value: '',
        required: false,
        default: '',
      },
      CURRENT_TYPE_NAME = this.data._props.dataType.name,
      CURRENT_ENUM = this.storeData.enums.find(_enum => (_enum.name === CURRENT_TYPE_NAME));

    if (disabled) {
      CONTROL.disabled = disabled;
    }
    this.last_field_data = {
      setVal: '',
    };

    switch (CURRENT_TYPE_NAME) {
      case 'BOOLEAN':
        CONTROL.type = 'dropdown';
        CONTROL.values = [
          ...(this.data && this.data._props && this.data._props.nullable ? [{
            value: null,
            label: 'null',
          }] : []),
          {
            value: true,
            label: 'true',
          },
          {
            value: false,
            label: 'false',
          }];

        break;
      case 'CHAR': //
      case 'VARCHAR': //
      case 'TIMEOFDAY': //
      case 'FLOAT': //
      case 'INTEGER': //
        break;
      // case 'TIMESTAMP':
      // TODO: need to create data time picker control
      //   break;
      // case 'BINARY':
      // TODO: need to create binary control or use file uploader?
      //   break;
      // case 'OBJECT':
      // TODO: need to support OBJECT data type
      //   break;
      // case 'ARRAY':
      // TODO: need to create ARRAY data type
      //   break;
      default:
        if (CURRENT_ENUM) {
          CONTROL.type = 'dropdown';
          CONTROL.values = [
            ...(this.data && this.data._props && this.data._props.nullable ? [{
              value: null,
              label: 'null',
            }] : []),
            ...CURRENT_ENUM.fields.map(field => ({
              value: field.name,
              label: field.name,
            }))];
        }
        break;
    }

    if (this.data && this.data._props && this.data._props.nullable) {
      CONTROL.value = null;
      this.last_field_data = {
        setVal: null,
      };
    }

    return CONTROL;
  }

  public onFormChanged() {
    if (this.isNewForm) {
      this.isNewForm = false;
      return;
    }
    const FORM_VALUE = this.dataForm.value;
    const REBUILD = this.ifNeedToRebuildForm(FORM_VALUE);
    if (REBUILD) {
      this.last_field_data = FORM_VALUE;
      this.rebuildForm(FORM_VALUE);
    }
    if (this.dataForm && this.dataForm.valid) {
      this.onSetNewVal();
    }
  }

  private rebuildForm(formValue) {
    const CONTROL = this.formBuilder.getControl('setVal');
    if (CONTROL) {
      if (formValue.drop) {
        CONTROL.disable();
        CONTROL.reset();
      } else {
        CONTROL.enable();
      }
    }
  }

  private ifNeedToRebuildForm(formValue) {
    if (this.ifDataLoss() && this.last_field_data) {
      if (this.last_field_data.drop !== formValue.drop) {
        return true;
      }
    }
    return false;
  }

  public ifDataLoss() {
    return this.ifDataError() && this.data.resolution === 'DataLoss';
  }

  public ifDataError() {
    return this.data && this.data._props && this.data._props.hasErrors;
  }

  public ifDefaultValueRequired() {
    return this.ifDataError() && this.data._props.defaultValueRequired && !this.ifDataLoss();
  }

  public getCBName(data) {
    return (data.groupName + data.name).replace('.', '_');
  }

  public onSetCBValue(event, ifSetValue?) {
    if (!ifSetValue) {
      this.appStore.dispatch(AddChangedValues({
        groupName: this.data.groupName,
        name: this.data.name,
        value: null,
      }));
      this.dataForm.reset({
        newValCB: false,
        newValInput: {
          value: null,
          disabled: true,
        },
      });
    } else {
      this.dataForm.get('newValInput').enable();
    }
  }

  public onSetNewVal() {
    const FORM_VALUE = this.dataForm.value;
    if (this.ifDataLoss()) {
      this.appStore.dispatch(AddChangedValues({
        groupName: this.data.groupName,
        name: this.data.name,
        value: !FORM_VALUE.drop ? FORM_VALUE.setVal : undefined,
      }));
    } else if (this.ifDefaultValueRequired()) {
      this.appStore.dispatch(AddChangedValues({
        groupName: this.data.groupName,
        name: this.data.name,
        value: FORM_VALUE.setVal,
      }));
    }
  }

  refresh(params: any): boolean {
    return false;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
