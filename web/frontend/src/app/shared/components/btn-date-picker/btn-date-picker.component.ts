import { Component, forwardRef, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR }                    from '@angular/forms';
import { BsDatepickerConfig }                                         from 'ngx-bootstrap';
import { GlobalFiltersService }                                       from '../../services/global-filters.service';
import { BehaviorSubject, combineLatest, Observable }                 from 'rxjs';
import { map, take }                                                  from 'rxjs/operators';
import { getDateUsingTZ }                                             from '../../locale.timezone';

@Component({
  selector: 'app-btn-date-picker',
  templateUrl: './btn-date-picker.component.html',
  styleUrls: ['./btn-date-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => BtnDatePickerComponent),
    },
  ],
})
export class BtnDatePickerComponent implements OnInit, ControlValueAccessor {
  
  @Input() set maxDate(maxDate: Date) {
    this.maxDate$.next(maxDate);
  }
  
  @Input() set minDate(minDate: Date) {
    this.minDate$.next(minDate);
  }
  
  @Input() set timeZone(object: object) {
    this.timeZone$.next(object);
  }
  
  @Input() value: Date | string;
  @Output() valueChange = new EventEmitter<Date | string>();
  
  bsConfig$: Observable<Partial<BsDatepickerConfig>>;
  private maxDate$ = new BehaviorSubject<Date>(null);
  private minDate$ = new BehaviorSubject<Date>(null);
  private timeZone$ = new BehaviorSubject<object>(null);
  
  constructor(private globalFiltersService: GlobalFiltersService) { }
  
  ngOnInit(): void {
    this.bsConfig$ = combineLatest([
      this.globalFiltersService.getFilters(),
      this.maxDate$,
      this.minDate$,
      this.timeZone$,
    ]).pipe(
      map(([filters, maxDate, minDate, customTimeZone]) => {
        const dateInputFormat = (filters.dateFormat[0].toUpperCase() + ' ' + filters.timeFormat[0])
          .replace('tt', 'A')
          .replace(/f/g, 'S');
        
        return {
          containerClass: 'theme-default',
          dateInputFormat,
          minDate: getDateUsingTZ(minDate, customTimeZone || filters.timezone[0]),
          maxDate: getDateUsingTZ(maxDate, customTimeZone || filters.timezone[0]),
        };
      }),
    );
  }
  
  registerOnChange(fn: (value: Date | string) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: any): void {
  }
  
  writeValue(value: Date | string): void {
    this.value = value;
  }
  
  onDateChange(value: Date | string) {
    const minDate = this.minDate$.getValue();
    const maxDate = this.maxDate$.getValue();
    if (minDate && value < minDate) {
      this.value = minDate;
    }
    
    if (maxDate && value > maxDate) {
      this.value = maxDate;
    }
    
    this.valueChange.emit(this.value);
    this.onChange(value);
  }
  
  onChange(value: Date | string) {
  }
}
