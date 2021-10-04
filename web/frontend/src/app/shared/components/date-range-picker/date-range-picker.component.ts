import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DateRange } from './date-range';
import { combineLatest, ReplaySubject } from 'rxjs';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    multi: true,
    useExisting: forwardRef(() => DateRangePickerComponent),
  }],
})
export class DateRangePickerComponent implements OnInit, ControlValueAccessor, OnDestroy {

  @Input() minDate: Date;
  @Input() maxDate: Date;

  startControl = new FormControl();
  endControl = new FormControl();

  private destroy$ = new ReplaySubject(1);

  constructor() { }

  ngOnInit(): void {
    combineLatest([
      this.startControl.valueChanges.pipe(startWith(this.startControl.value)),
      this.endControl.valueChanges.pipe(startWith(this.endControl.value)),
    ]).subscribe(([start, end]) => this.onChange({start, end}));
  }

  registerOnChange(fn: (value: DateRange) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  writeValue(value: DateRange): void {
    this.startControl.patchValue(value.start);
    this.endControl.patchValue(value.end);
  }

  onChange(value: DateRange) {
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
