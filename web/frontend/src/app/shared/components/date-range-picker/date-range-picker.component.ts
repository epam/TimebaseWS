import {Component, forwardRef, Input, OnDestroy, OnInit, Output, EventEmitter} from '@angular/core';
import {ControlValueAccessor, UntypedFormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import {BehaviorSubject, combineLatest, Observable, ReplaySubject} from 'rxjs';
import {map, startWith, takeUntil} from 'rxjs/operators';
import {GlobalFilterTimeZone} from '../../../pages/streams/models/global.filter.model';
import {GlobalFiltersService} from '../../services/global-filters.service';
import {getTimeZoneObject} from '../../utils/timezone.utils';
import {DateRange} from './date-range';

@Component({
  selector: 'app-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => DateRangePickerComponent),
    },
  ],
})
export class DateRangePickerComponent implements OnInit, ControlValueAccessor, OnDestroy {
  @Input() minDate: Date;
  @Input() maxDate: Date;
  @Input() clearBtn = false;
  @Input() timeRangeOptional: { startTimeDisabled: boolean, endTimeDisabled: boolean };
  @Input() showLabels: boolean = false;
  @Input() rangeDisabled: boolean = false;
  @Input() timeInvalid: { startTime: boolean, endTime: boolean };
  @Input() startInvalid = false;
  @Input() endInvalid = false;

  @Input() set timezone(timezone: string) {
    this.timezone$.next(timezone);
  }
  @Output() setTimeRangeState = new EventEmitter<{ [key: string]: boolean }>();

  public startControl = new UntypedFormControl();
  public endControl = new UntypedFormControl();
  public selectedTimezone$: Observable<GlobalFilterTimeZone>;
  private destroy$ = new ReplaySubject(1);
  private timezone$ = new BehaviorSubject<string>(null);

  constructor (private globalFiltersService: GlobalFiltersService) {}

  ngOnInit(): void {
    combineLatest([
      this.startControl.valueChanges.pipe(startWith(this.startControl.value)),
      this.endControl.valueChanges.pipe(startWith(this.endControl.value)),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([start, end]) => this.onChange({start, end}));

    this.selectedTimezone$ = combineLatest([
      this.timezone$,
      this.globalFiltersService.getFilters(),
    ]).pipe(
      map(([customTimezone, filters]) =>
        customTimezone
          ? {
              nameTitle: customTimezone,
              ...getTimeZoneObject(customTimezone),
            }
          : filters.timezone[0],
      ),
      takeUntil(this.destroy$),
    );
  }

  registerOnChange(fn: (value: DateRange) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {}

  writeValue(value: DateRange): void {
    this.startControl.patchValue(value.start);
    this.endControl.patchValue(value.end);
  }

  onStartValueChanged(newDate: Date) {}

  onEndValueChanged(newDate: Date) {}

  onChange(value: DateRange) {}

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  toggleTimeRangeState(startOrEnd: 'start' | 'end') {
    if (startOrEnd === 'start') {
      this.setTimeRangeState.emit({ startTimeDisabled: !this.timeRangeOptional.startTimeDisabled });
    } else {
      this.setTimeRangeState.emit({ endTimeDisabled: !this.timeRangeOptional.endTimeDisabled });
    }
  }
}
