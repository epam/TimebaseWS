import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {FieldModel} from '../field-builder/field-model';

@Component({
  selector: 'app-dropdown',
  template: `
    <div [formGroup]="form">
      <select
        class="form-control"
        [id]="(field.parentName || '') + field.name"
        [formControlName]="field.name"
        [attr.readonly]="field.readonly">
        <ng-container *ngFor="let option of field.values">
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
  @Input() form: FormGroup;

  isComplexValue = false;

  ngOnChanges(changes: SimpleChanges): void {
    const values = this.field.values;
    this.isComplexValue =
      values[0] && typeof values[0] === 'object' && values[0].value !== undefined;
  }
}
