import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  AbstractControlOptions,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
}                                                                                             from '@angular/forms';
import { Subject }                                                                            from 'rxjs';
import { isArray }                                                                            from 'rxjs/internal-compatibility';
import { takeUntil }                                                                          from 'rxjs/operators';
import { FieldModel }                                                                         from './field-builder/field-model';

export const PATH_SEPARATOR = '.';

@Component({
  selector: 'app-dynamic-form-builder',
  template: `
    <form [formGroup]="form" class="form-horizontal props-form">
      <div *ngFor="let field of fieldsInfo">
        <app-field-builder [field]="field" [form]="form"></app-field-builder>
      </div>
    </form>
  `,
  styleUrls: ['./dynamic-form-builder.module.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormBuilderComponent implements OnInit, OnDestroy {
  public fieldsInfo: any[] = [];
  @Input() form: FormGroup;
  @Output() formChange = new EventEmitter();
  @Output() formChanged = new EventEmitter();
  private destroy$ = new Subject();
  private destroyForm$ = new Subject();

  @Input()
  set fields(fields: any[]) {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.destroy$ = new Subject();
    if (!fields) {
      fields = [];
    }

    this.initForm(fields);
    this.fieldsInfo = [...fields];
  }

  constructor(private cdRef: ChangeDetectorRef) {
  }

  private initForm(fields: FieldModel[]) {
    this.form = new FormGroup(this.formGenerator(fields));
    this.formChange.emit(this.form);

    this.form.valueChanges
      .pipe(
        takeUntil(this.destroyForm$),
        takeUntil(this.destroy$),
      )
      .subscribe(this.onFormChange.bind(this));
  }

  private formGenerator(_fields: FieldModel[]): { [key: string]: AbstractControl; } {
    const CONTROLS: {
      [key: string]: AbstractControl;
    } = {};
    for (const field of _fields) {
      CONTROLS[field.name] = this.createFormControl(field);
    }
    return CONTROLS;
  }

  private createFormControl(field: FieldModel): FormControl | FormGroup {
    if (field.type !== 'array' && field.type !== 'object') {
      return new FormControl(this.getValue(field), this.getValidators(field));
    }
    if (field.type === 'object' && field.childFields) {
      return new FormGroup(this.formGenerator(field.childFields));
    }
  }

  public updateView(control: AbstractControl) {
    this.cdRef.detectChanges();
    
    if (!control) {
      return;
    }
    
    control.updateValueAndValidity();
  }

  public getControl(pathAndNameString: string): FormControl {
    const {groupPath, controlName} = this.parseFormControlPathAndName(pathAndNameString);
    const CURRENT_GROUP = this.getFormGroup(groupPath);
    if (!CURRENT_GROUP.get(controlName)) {
      console.warn(`There is no control with path [${pathAndNameString}] in current form`);
      return null;
    }
    return (CURRENT_GROUP.get(controlName) as FormControl);
  }

  public addControl(pathAndNameString: string, field: FieldModel, index: number = -1) {
    const {groupPath, controlName} = this.parseFormControlPathAndName(pathAndNameString);
    const CURRENT_FORM_GROUP = this.getFormGroup(groupPath),
      CURRENT_FIELD_GROUP = this.getFieldGroup(groupPath);
    if (CURRENT_FORM_GROUP && CURRENT_FIELD_GROUP && CURRENT_FIELD_GROUP.length) {
      CURRENT_FORM_GROUP.addControl(controlName, this.createFormControl(field));
      CURRENT_FIELD_GROUP.splice(index, 0, field);
      this.updateView(CURRENT_FORM_GROUP.get(controlName));
    }
  }

  public removeControl(pathAndNameString: string): number | null {
    const {groupPath, controlName} = this.parseFormControlPathAndName(pathAndNameString);
    const CURRENT_GROUP = this.getFormGroup(groupPath),
      CURRENT_FIELD_GROUP = this.getFieldGroup(groupPath),
      CURRENT_FIELD_INDEX = CURRENT_FIELD_GROUP.findIndex(group_field => group_field.name === controlName);
    if (!CURRENT_GROUP.get(controlName)) {
      return null;
    }
    if (CURRENT_FIELD_INDEX) {
      CURRENT_GROUP.removeControl(controlName);
      CURRENT_FIELD_GROUP.splice(CURRENT_FIELD_INDEX, 1);
      return CURRENT_FIELD_INDEX;
    }
    return null;
  }

  public replaceControl(pathAndNameString: string, field: FieldModel) {
    const NEW_INDEX = this.removeControl(pathAndNameString);
    this.addControl(pathAndNameString, field, NEW_INDEX);
  }

  private getFormGroup(groupPath: string[]): FormGroup {
    let currentGroup = this.form;
    groupPath.every(groupName => {
      if (currentGroup.get(groupName) instanceof FormGroup) {
        currentGroup = (currentGroup.get(groupName) as FormGroup);
        return true;
      } else {
        return false;
      }
    });
    return currentGroup;
  }

  private getFieldGroup(groupPath: string[]): FieldModel[] {
    let currentGroup = this.fieldsInfo;
    groupPath.every(groupName => {
      const GROUP_INDEX = currentGroup.findIndex(field => field.name === groupName);
      if (currentGroup[GROUP_INDEX] && currentGroup[GROUP_INDEX].childFields && isArray(currentGroup[GROUP_INDEX].childFields) && currentGroup[GROUP_INDEX].childFields.length) {
        currentGroup = currentGroup[GROUP_INDEX].childFields;
        return true;
      } else {
        return false;
      }
    });
    return currentGroup;
  }

  private parseFormControlPathAndName(pathAndNameString: string): { groupPath: string[], controlName: string } {
    if (!(pathAndNameString && typeof pathAndNameString === 'string' && pathAndNameString.length)) {
      return {
        controlName: null,
        groupPath: null,
      };
    }
    const groupPath = pathAndNameString.split(PATH_SEPARATOR),
      controlName = groupPath.splice(-1, 1)[0];
    return {groupPath, controlName};
  }

  private getValue(field: FieldModel) {
    let controlValue = (field.value !== null) ? field.value : field.type === 'checkbox' ? false : '';
    if (field.disabled) {
      controlValue = {
        value: controlValue,
        disabled: field.disabled,
      };
    }
    return controlValue;
  }

  private getValidators(field: FieldModel): ValidatorFn | ValidatorFn[] | AbstractControlOptions | null {
    if (field.validators) {
      const VALIDATORS_OPTS: AbstractControlOptions = {};
      if (field.validators.getValidators) {
        VALIDATORS_OPTS.validators = field.validators.getValidators();
      }
      if (field.validators.getAsyncValidators) {
        VALIDATORS_OPTS.asyncValidators = field.validators.getAsyncValidators();
      }
      return VALIDATORS_OPTS;
    }
    return field.required && field.type !== 'checkbox' ? Validators.required : null;
  }

  public onFormChange() {
    this.formChanged.emit(this.form.value);
  }

  public tracker(index, field) {
    return index;
  }


  ngOnInit() {
    this.initForm(this.fieldsInfo);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
