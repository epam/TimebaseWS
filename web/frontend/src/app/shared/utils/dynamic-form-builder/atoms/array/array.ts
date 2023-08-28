import {Component, Input, OnInit} from '@angular/core';
import {UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {FieldModel} from '../../field-builder/field-model';

//
@Component({
  selector: 'app-array',
  template: `
    <div class="form-array-wr" [formGroup]="form">
      <ng-template [ngIf]="isControlInited">
        <div class="form-array" [formArrayName]="field.name">
          <ng-template [ngIf]="!!form.get(field.name)['controls'].length">
            <div
              class="form-array-group"
              *ngFor="let control of form.get(field.name)['controls']; let i = index"
              [formGroupName]="i">
              <ng-template ngFor let-field [ngForOf]="this.field.childFields">
                <app-field-builder
                  class="form-array-control"
                  [field]="field"
                  [form]="control"></app-field-builder>
              </ng-template>
              <div class="btn-panel">
                <ng-template [ngIf]="i === form.get(field.name)['controls'].length - 1">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-success btn-addControl"
                    [title]="'buttons.add_more' | translate"
                    (click)="addNewControls()">
                    +
                  </button>
                </ng-template>
                <ng-template
                  [ngIf]="
                    (form.get(field.name)['controls'].length > 1 && field.required) ||
                    (form.get(field.name)['controls'].length > 0 && !field.required)
                  ">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    [title]="'buttons.remove' | translate"
                    (click)="removeControls(i)">
                    -
                  </button>
                </ng-template>
              </div>
            </div>
          </ng-template>

          <ng-template [ngIf]="!form.get(field.name)['controls'].length">
            <button
              type="button"
              class="btn btn-sm btn-outline-success btn-addControl"
              [title]="'buttons.add_more' | translate"
              (click)="addNewControls()">
              +
            </button>
          </ng-template>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./array.scss'],
})
export class ArrayComponent implements OnInit {
  @Input() field: FieldModel;
  @Input() form: UntypedFormGroup;
  public controlsArray: UntypedFormArray;
  public isControlInited: boolean;

  constructor() {}

  get isValid() {
    return this.form.get(this.field.name) ? this.form.get(this.field.name).valid : true;
  }

  get isDirty() {
    return this.form.get(this.field.name) ? this.form.get(this.field.name).dirty : false;
  }

  ngOnInit(): void {
    // this.field.required = false;
    const controls =
      this.field.values && this.field.values.length
        ? this.field.values
        : this.field.required
        ? [{}]
        : [];
    this.controlsArray = new UntypedFormArray(
      controls.map(this.getFormGroup.bind(this)),
      this.field.required ? [Validators.required] : null,
    );
    this.form.addControl(this.field.name, this.controlsArray);
    this.isControlInited = true;
  }

  getFormGroup(value: any) {
    const controls = {};
    this.field.childFields.forEach((field: FieldModel) => {
      controls[field.name] = new UntypedFormControl(
        value[field.name] !== null ? value[field.name] : '',
        field.required ? [Validators.required] : null,
      );
    });
    return new UntypedFormGroup(controls);
  }

  addNewControls() {
    (<UntypedFormArray>this.controlsArray).push(this.getFormGroup({}));
  }

  removeControls(controlGroup) {
    (<UntypedFormArray>this.controlsArray).removeAt(controlGroup);
  }
}
