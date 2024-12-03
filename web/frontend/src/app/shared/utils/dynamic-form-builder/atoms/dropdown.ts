import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {FieldModel} from '../field-builder/field-model';

@Component({
  selector: 'app-dropdown',
  template: `
    <div [formGroup]="form">
      <select
        class="form-control"
        [id]="(field.parentName || '') + field.name"
        [name]="field.name"
        [formControlName]="field.name"
        [attr.readonly]="field.readonly"
        [ngStyle]="{ 'outline': (field.required && form.get(field.name).value === null) ? '1px solid red' : 'none' }">
        <ng-container *ngFor="let option of options">
          <option *ngIf="isComplexValue; else simple" [ngValue]="option.value">
            {{ option.label }}
          </option>
          <ng-template #simple
            ><option [ngValue]="option">{{ option }}</option></ng-template
          >
        </ng-container>
      </select>
    </div>
  `,
})
export class DropDownComponent implements OnChanges {
  @Input() field: FieldModel;
  @Input() nullableFields = false;
  @Input() form: UntypedFormGroup;

  isComplexValue = false;
  options = [];

  ngOnChanges(changes: SimpleChanges): void {
    const values = this.field.values;
    if (!this.field.required && !values.includes('null') && this.nullableFields) {
      this.options = [ ...values.map(value => ({ value, label: value })), { value: null, label: 'null' }];
      this.isComplexValue = true;
    } else if (values.includes('') && this.field.name === 'encoding') {
      this.options = [ ...values.map(value => ({ value: !value ? null : value, label: !value ? '' : value }))];
      this.isComplexValue = true;

      if (this.form.get('encoding').value === '') {
        this.options.unshift({ value: '', label: '<EMPTY>' })
      }
    } else {
      this.options = values;
      this.isComplexValue =
        values[0] && typeof values[0] === 'object' && values[0].value !== undefined;
    }
  }
}
