import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {Observable, ReplaySubject} from 'rxjs';
import {debounceTime, map, takeUntil} from 'rxjs/operators';
import {GlobalFiltersService} from '../../../services/global-filters.service';
import {FieldBuilderGroupDirective} from '../field-builder-group.directive';
import {FieldModel} from './field-model';

@Component({
  selector: 'app-field-builder',
  template: `
    <div
      class="form-group d-flex align-items-start controlWr"
      [class.not-aligned-labels]="!alignLabels"
      [class.child-form-group]="field.childFields && field.childFields.length">
      <label
        #label
        [class.disabled]="form.get(field.name)?.disabled"
        class="form-control-label btn control-label"
        [attr.for]="(field.parentName || '') + field.name">
        <strong class="text-danger" *ngIf="field.required && alignLabels">*</strong>
        {{ field.label }}
        <strong class="text-danger" *ngIf="field.required && !alignLabels">*</strong>
      </label>
      <div
        class="form-control-wr"
        [ngSwitch]="field.type"
        [ngClass]="{'form-group': field.type === 'object'}">
        <app-textbox *ngSwitchCase="'text'" [field]="field" [form]="form"></app-textbox>
        <app-textbox *ngSwitchCase="'binary'" [field]="field" [form]="form"></app-textbox>
        <app-textbox *ngSwitchCase="'number'" [field]="field" [form]="form"></app-textbox>
        <app-textbox *ngSwitchCase="'password'" [field]="field" [form]="form"></app-textbox>
        <ng-container *ngSwitchCase="'autocomplete'" [formGroup]="form">
          <deltix-ng-autocomplete
            free="true"
            class="btn input-control"
            [values]="field.values"
            cssClass="in-modal"
            (changeInput)="onAutocompleteInput($event)"
            (selectItem)="onAutocompleteInput($event)"
            [formControlName]="field.name">
          </deltix-ng-autocomplete>
        </ng-container>
        <app-array *ngSwitchCase="'array'" [field]="field" [form]="form"></app-array>
        <ng-container *ngSwitchCase="'object'">
          <div [appFieldBuilderGroup]="field.childFields">
            <app-field-builder
              *ngFor="let child_field of field.childFields; trackBy: trackByName"
              [field]="child_field"
              [form]="getFormChildGroup(form, field.name)"></app-field-builder>
          </div>
        </ng-container>
        <app-dropdown *ngSwitchCase="'dropdown'" [field]="field" [form]="form"></app-dropdown>
        <select
          *ngSwitchCase="'select'"
          class="btn input-control"
          [formControl]="form.get(field.name)">
          <option *ngFor="let val of field.values" [ngValue]="val.key">
            {{ val.title }}
          </option>
        </select>
        <app-multiselect
          *ngSwitchCase="'multiselect'"
          [field]="field"
          [formControl]="control"></app-multiselect>
        <app-checkbox *ngSwitchCase="'checkbox'" [field]="field" [form]="form"></app-checkbox>
        <app-radio *ngSwitchCase="'radio'" [field]="field" [form]="form"></app-radio>
        <app-timepicker
          *ngSwitchCase="'datetimepicker'"
          [field]="field"
          [form]="form"></app-timepicker>
        <ng-container *ngSwitchCase="'btn-timepicker'" [formGroup]="form">
          <app-btn-date-picker
            *ngIf="timezone$ | async as timeZone"
            [timeZone]="timeZone"
            [field]="field"
            [clearBtn]="!field.required"
            [formControlName]="field.name"></app-btn-date-picker>
        </ng-container>
        <button
          (click)="onEditJson(field)"
          *ngSwitchCase="'json'"
          type="button"
          class="btn btn-primary btn-btn">
          {{ 'fieldBuilder.editJson' | translate }}
        </button>
        <app-file *ngSwitchCase="'file'" [field]="field" [form]="form"></app-file>
        <div
          *ngIf="control?.invalid && control?.dirty && field.validators"
          class="alert alert-danger my-1 p-2 fadeInDown animated"
          [innerHTML]="
            field.validators.getErrorsText
              ? (field.validators.getErrorsText(control) | async)
              : field.label + ' is required'
          "></div>
      </div>
    </div>
    <div class="form-control-label form-control-description" *ngIf="field.description">
      {{ field.description }}
    </div>
  `,
  styleUrls: ['field-builder.component.scss'],
})
export class FieldBuilderComponent implements OnDestroy, OnChanges, OnInit, AfterViewInit {
  @ViewChild('label') label: ElementRef<HTMLElement>;
  @Input() field: FieldModel;
  @Input() form: UntypedFormGroup;
  @Input() alignLabels = true;

  @Output() editJson = new EventEmitter<FieldModel>();

  timezone$: Observable<object>;

  private field$ = new ReplaySubject<FieldModel>(1);
  private destroy$ = new ReplaySubject<void>(1);

  constructor(
    @Optional() private fieldBuilderGroupDirective: FieldBuilderGroupDirective,
    private globalFiltersService: GlobalFiltersService,
  ) {}

  get control(): UntypedFormControl {
    return (this.form.get(this.field.name) as UntypedFormControl) || null;
  }

  public getFormChildGroup(form: UntypedFormGroup, name: string): UntypedFormGroup {
    return form.get(name) as UntypedFormGroup;
  }

  ngOnInit() {
    this.timezone$ = this.globalFiltersService
      .getFilters()
      .pipe(map((filters) => filters.timezone[0]));
  }

  ngAfterViewInit() {
    if (this.alignLabels) {
      this.field$.pipe(takeUntil(this.destroy$), debounceTime(0)).subscribe(() => {
        this.fieldBuilderGroupDirective?.setLabelWidth(this.labelWidth());
      });
    }
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

  labelWidth(): number {
    const el = this.label.nativeElement;
    el.style.overflow = 'unset';
    el.style.maxWidth = 'unset';
    el.style.minWidth = 'unset';
    const width = el.offsetWidth;
    el.style.removeProperty('overflow');
    el.style.removeProperty('max-width');
    el.style.removeProperty('min-width');
    return width + 1;
  }

  onEditJson(field: FieldModel) {
    this.editJson.emit(field);
  }

  onAutocompleteInput(value: string) {
    this.form.get(this.field.name).setValue(value);
  }
}
