import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {HdDate} from '@assets/hd-date/hd-date';
import {BsDatepickerConfig} from 'ngx-bootstrap/datepicker';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {SafeDatePickerValueDirective} from '../../directives/safe-date-picker/safe-date-picker-value.directive';
import {getDateUsingTZ} from '../../locale.timezone';
import {TimeZone} from '../../models/timezone.model';
import {GlobalFiltersService} from '../../services/global-filters.service';
import {dateFromTZToDate, hdDateToTZ} from '../../utils/timezone.utils';

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
  @Input() value: Date | string = null;
  @Input() clearBtn = false;
  @Output() valueChange = new EventEmitter<Date | string>();
  @ViewChild(SafeDatePickerValueDirective)
  private safeDatePickerValueDirective: SafeDatePickerValueDirective;
  bsConfig$: Observable<Partial<BsDatepickerConfig>>;
  hasValue = false;
  private maxDate$ = new BehaviorSubject<Date>(null);
  private minDate$ = new BehaviorSubject<Date>(null);
  private timeZone$ = new BehaviorSubject<object>(null);

  constructor(
    private globalFiltersService: GlobalFiltersService,
    private cdRef: ChangeDetectorRef,
  ) {}

  @Input() set maxDate(maxDate: Date) {
    const CURRENT_TIMEZONE = this.timeZone$.getValue() as TimeZone;

    if (maxDate && CURRENT_TIMEZONE) {
      maxDate = new Date(
        hdDateToTZ(
          new HdDate(new Date(maxDate).toISOString()),
          CURRENT_TIMEZONE?.name,
        ).toISOString(),
      );
    }
    this.maxDate$.next(maxDate);
  }

  @Input() set timeZone(object: object) {
    this.timeZone$.next(object);
  }

  @Input() set minDate(minDate: Date) {
    const CURRENT_TIMEZONE = this.timeZone$.getValue() as TimeZone;

    if (minDate && CURRENT_TIMEZONE) {
      minDate = new Date(
        hdDateToTZ(
          new HdDate(new Date(minDate).toISOString()),
          CURRENT_TIMEZONE?.name,
        ).toISOString(),
      );
    }
    this.minDate$.next(minDate);
  }

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

  registerOnTouched(fn: any): void {}

  writeValue(value: Date | string): void {
    const CURRENT_TIMEZONE = this.timeZone$.getValue() as TimeZone;
    if (value && CURRENT_TIMEZONE) {
      this.value = new Date(
        hdDateToTZ(new HdDate(new Date(value).toISOString()), CURRENT_TIMEZONE?.name).toISOString(),
      );
    } else {
      this.value = value;
    }

    if (!value) {
      this.safeDatePickerValueDirective?.setNull();
    }
    this.hasValue = !!value;
    this.cdRef.detectChanges();
  }

  onDateChange(value: Date) {
    const minDate = this.minDate$.getValue();
    const maxDate = this.maxDate$.getValue();
    const CURRENT_TIMEZONE = this.timeZone$.getValue() as TimeZone;
    if (minDate && value < minDate) {
      this.value = dateFromTZToDate(minDate, CURRENT_TIMEZONE.name);
    }

    if (maxDate && value > maxDate) {
      this.value = dateFromTZToDate(maxDate, CURRENT_TIMEZONE.name);
    }

    this.value = value;
    this.hasValue = !!value;
    this.valueChange.emit(this.value);
    this.onChange(dateFromTZToDate(value, CURRENT_TIMEZONE.name));
  }

  clear() {
    this.value = null;
    this.valueChange.emit(this.value);
    this.onChange(null);
    this.safeDatePickerValueDirective.setNull();
    this.hasValue = false;
  }

  onChange(value: Date | string) {}
}
