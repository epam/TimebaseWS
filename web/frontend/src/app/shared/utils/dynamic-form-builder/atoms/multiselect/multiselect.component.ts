import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {IDropdownSettings} from 'ng-multiselect-dropdown/multiselect.model';
import {timer} from 'rxjs';
import {FieldModel} from '../../field-builder/field-model';

@Component({
  selector: 'app-multiselect',
  templateUrl: './multiselect.component.html',
  styleUrls: ['./multiselect.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => MultiselectComponent),
    },
  ],
})
export class MultiselectComponent implements OnInit, ControlValueAccessor {
  @Input() field: FieldModel;

  dropdownList;
  dropdownSettings: IDropdownSettings;
  model: string[] | object[] = [];
  disabled: boolean;

  private dropdownDefaultSettings = {
    singleSelection: false,
    itemsShowLimit: 10,
    allowSearchFilter: true,
    idField: 'name',
    textField: 'name',
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
  };

  private ignoreChange = false;

  ngOnInit() {
    this.dropdownList = this.ifComplexValues(this.field.values)
      ? this.field.values
      : this.field.values.map((name) => ({name}));

    this.dropdownSettings = {
      ...this.dropdownDefaultSettings,
      ...(this.field._controlSpecOptions || {}),
    };
  }

  registerOnChange(fn: (data: string[] | object[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  writeValue(data: string[] | object[]): void {
    this.ignoreChange = true;
    this.model = data;
    timer().subscribe(() => (this.ignoreChange = false));
  }

  onChange(data: string[] | object[]) {}

  onModelChange(data: any) {
    if (this.ignoreChange) {
      return;
    }

    const value = this.ifComplexValues(this.field.values) ? data : data?.map(({name}) => name);
    this.onChange(value);
  }

  private ifComplexValues(values: any[]): boolean {
    return values[0] && typeof values[0] === 'object' && values[0].value !== undefined;
  }
}
