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
} from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { BsDatepickerDirective } from 'ngx-bootstrap';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[appSafeDatePickerValue]',
})
export class SafeDatePickerValueDirective implements OnInit, OnDestroy, OnChanges {
  @Input() appSafeDatePickerValue: Date | string;
  @Output() appSafeDatePickerValueChange = new EventEmitter<Date | string>();

  private destroy$ = new ReplaySubject(1);
  private lastValidValue: Date;
  private lastManuallyEnteredValid = true;

  constructor(private datePicker: BsDatepickerDirective) {
  }

  @HostListener('input', ['$event.target.value']) change(dateString: string) {
    this.lastManuallyEnteredValid = this.getDateRegexp().test(dateString);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.setValue();
  }

  ngOnInit() {
    this.datePicker.bsValueChange.pipe(takeUntil(this.destroy$)).subscribe(value => {
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

  private setValue() {
    if (!this.datePicker) {
      return;
    }

    this.lastManuallyEnteredValid = true;
    this.datePicker.bsValue = this.safeValue(this.appSafeDatePickerValue);
  }

  private safeValue(value: string | Date): Date {
    const date = new Date(value);
    // Via calendar date is always correct, via manually we check by regexp
    if (value && (this.datePicker.isOpen || this.lastManuallyEnteredValid)) {
      this.lastValidValue = date;
      return date;
    }

    return this.lastValidValue || null;
  }

  private getDateRegexp(): RegExp {
    const available = new Set(['Y', 'M', 'D', 'h', 'H', 'm', 's', 'A', 'S']);
    const holders = { A: '(AM|PM)' };
    const escape = new Set(['.']);
    const regexp = this.datePicker._config.dateInputFormat.split('').map(symbol => {
      if (available.has(symbol)) {
        return holders[symbol] || '\\d';
      }

      return escape.has(symbol) ? `\\${symbol}` : symbol;
    }).join('');
    return new RegExp(`^${regexp}$`);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
