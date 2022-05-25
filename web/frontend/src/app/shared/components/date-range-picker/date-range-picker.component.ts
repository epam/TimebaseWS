import {Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable, ReplaySubject, Subject} from 'rxjs';
import {map, startWith, takeUntil} from 'rxjs/operators';
import {AppState} from '../../../core/store';
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

  @Input() set timezone(timezone: string) {
    this.timezone$.next(timezone);
  }

  public startControl = new FormControl();
  public endControl = new FormControl();
  public selectedTimezone$: Observable<GlobalFilterTimeZone>;
  private destroy$ = new ReplaySubject(1);
  private timezone$ = new BehaviorSubject<string>(null);

  constructor(
    private appStore: Store<AppState>,
    private globalFiltersService: GlobalFiltersService,
  ) {}

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
}
