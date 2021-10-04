import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit, SimpleChanges,
}                                    from '@angular/core';
import { FormControl, FormGroup }                       from '@angular/forms';
import { combineLatest, Observable, of, ReplaySubject } from 'rxjs';
import { delay, map, switchMap, takeUntil }             from 'rxjs/operators';
import { FieldModel }                       from './field-model';

@Component({
  selector: 'app-field-builder',
  template: `
    <div
      class="form-group d-flex align-items-start controlWr"
      [class.child-form-group]="field.childFields && field.childFields.length"
    >
      <label class="form-control-label btn control-label" [attr.for]="(field.parentName || '') + field.name">
        <strong class="text-danger" *ngIf="field.required">*</strong>
        {{ field.label }}
      </label>
      <div class="form-control-wr" [ngSwitch]="field.type" [ngClass]="{'form-group': field.type === 'object'}">
        <app-textbox *ngSwitchCase="'text'" [field]="field" [form]="form"></app-textbox>
        <app-textbox *ngSwitchCase="'number'" [field]="field" [form]="form"></app-textbox>
        <app-textbox *ngSwitchCase="'password'" [field]="field" [form]="form"></app-textbox>
        <app-array *ngSwitchCase="'array'" [field]="field" [form]="form"></app-array>
        <ng-container *ngSwitchCase="'object'">
          <app-field-builder
            *ngFor="let child_field of field.childFields; trackBy: trackByName"
            [field]="child_field"
            [form]="getFormChildGroup(form, field.name)"
          ></app-field-builder>
        </ng-container>
        <app-dropdown *ngSwitchCase="'dropdown'" [field]="field" [form]="form"></app-dropdown>
        <app-multiselect *ngSwitchCase="'multiselect'" [field]="field" [formControl]="control" ></app-multiselect>
        <app-checkbox *ngSwitchCase="'checkbox'" [field]="field" [form]="form"></app-checkbox>
        <app-radio *ngSwitchCase="'radio'" [field]="field" [form]="form"></app-radio>
        <app-timepicker *ngSwitchCase="'datetimepicker'" [field]="field" [form]="form"></app-timepicker>
        <app-file *ngSwitchCase="'file'" [field]="field" [form]="form"></app-file>
        <div *ngIf="control?.invalid && control?.dirty && field.validators"
             class="alert alert-danger my-1 p-2 fadeInDown animated"
             [innerHTML]="
             field.validators.getErrorsText ?
             (field.validators.getErrorsText(control) | async) :
             (field.label + ' is required')
             "
        ></div>
      </div>
    </div>
    <div class="form-control-label form-control-description" *ngIf="field.description">
      {{field.description}}
    </div>
  `,
})
export class FieldBuilderComponent implements OnDestroy, OnChanges {
  @Input() field: FieldModel;
  @Input() form: FormGroup;
  
  private field$ = new ReplaySubject<FieldModel>(1);
  private destroy$ = new ReplaySubject<void>(1);

  get control(): FormControl {
    return this.form.get(this.field.name) as FormControl || null;
  }

  public getFormChildGroup(form: FormGroup, name: string): FormGroup {
    return form.get(name) as FormGroup;
  }
  
  trackByName(index, field: FieldModel): string {
    return field?.name;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    this.field$.next(this.field);
  }
}
