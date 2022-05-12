import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
}                                from '@angular/core';
import { parseDate }             from 'ngx-bootstrap/chronos';
import { BsDatepickerDirective } from 'ngx-bootstrap/datepicker';
import { ReplaySubject, timer }  from 'rxjs';
import { takeUntil }             from 'rxjs/operators';

@Directive({
  selector: '[appSafeDatePickerValue]',
})
export class SafeDatePickerValueDirective implements OnInit, OnDestroy, OnChanges {
  @Input() appSafeDatePickerValue: Date | string;
  @Output() appSafeDatePickerValueChange = new EventEmitter<Date | string>();

  private destroy$ = new ReplaySubject(1);
  private lastValidValue: Date;
  private lastManuallyEnteredValid = true;
  private isNull = true;
  private lastManuallyEntered: string;

  constructor(private datePicker: BsDatepickerDirective) {}

  @HostListener('input', ['$event.target.value']) change(dateString: string) {
    this.lastManuallyEnteredValid =
      this.getDateRegexp().test(dateString) &&
      !!parseDate(dateString, this.datePicker._config.dateInputFormat).getTime();
    this.lastManuallyEntered = dateString;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.setValue();
  }

  ngOnInit() {
    this.datePicker.bsValueChange.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (this.isNull && this.lastManuallyEntered && value?.getTime()) {
        this.appSafeDatePickerValue = parseDate(
          this.lastManuallyEntered,
          this.datePicker._config.dateInputFormat,
        );
        this.setValue();
        this.isNull = false;
        this.appSafeDatePickerValueChange.emit(this.safeValue(this.appSafeDatePickerValue));
        return;
      }

      this.isNull = false;
      if (value === null) {
        return;
      }

      const lastSafeValue = this.safeValue(this.appSafeDatePickerValue);
      const safeValue = this.safeValue(value);

      if (safeValue?.getTime() !== lastSafeValue?.getTime()) {
        this.appSafeDatePickerValue = safeValue;
        this.appSafeDatePickerValueChange.emit(safeValue);
      }

      if (safeValue?.getTime() !== value?.getTime()) {
        this.setValue();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setValue() {
    if (!this.datePicker) {
      return;
    }

    this.lastManuallyEnteredValid = true;
    const saveValue = this.safeValue(this.appSafeDatePickerValue)?.getTime();
    const isNull = saveValue === undefined;
    this.datePicker.bsValue = !isNull ? new Date(saveValue) : null;

    // Double set to fix time issue of datepicker
    this.datePicker.bsValue = !isNull ? new Date(saveValue) : null;
    this.isNull = isNull;
  }

  setNull() {
    this.lastValidValue = null;
    this.datePicker.bsValue = null;
    timer().subscribe(() => (this.isNull = true));
  }

  private safeValue(value: string | Date): Date {
    const date = value ? new Date(value) : null;
    // Via calendar date is always correct, via manually we check by regexp
    if (date && (this.datePicker.isOpen || this.lastManuallyEnteredValid)) {
      this.lastValidValue = date;
      return date;
    }

    return this.lastValidValue || null;
  }

  private getDateRegexp(): RegExp {
    const available = new Set(['Y', 'M', 'D', 'h', 'H', 'm', 's', 'A', 'S']);
    const holders = {A: '(AM|PM)'};
    const escape = new Set(['.']);
    const regexp = this.datePicker._config.dateInputFormat
      .split('')
      .map((symbol) => {
        if (available.has(symbol)) {
          return holders[symbol] || '\\d';
        }

        return escape.has(symbol) ? `\\${symbol}` : symbol;
      })
      .join('');
    return new RegExp(`^${regexp}$`);
  }
}
