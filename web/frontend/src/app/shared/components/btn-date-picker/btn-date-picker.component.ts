import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {HdDate} from '@assets/hd-date/hd-date';
import {BsDatepickerConfig, BsDatepickerDirective} from 'ngx-bootstrap/datepicker';
import {GlobalFiltersService} from '../../services/global-filters.service';
import {SafeDatePickerValueDirective} from '../../directives/safe-date-picker/safe-date-picker-value.directive';
import {formatHDate, getDateUsingTZ} from '../../locale.timezone';
import {TimeZone} from '../../models/timezone.model';
import { FieldModel } from '../../utils/dynamic-form-builder/field-builder/field-model';
import {dateFromTZToDate, hdDateToTZ} from '../../utils/timezone.utils';
import { GlobalFilters } from '../../models/global-filters';
import moment from 'moment';

type Placement = 'left' | 'top' | 'bottom' | 'right';

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
export class BtnDatePickerComponent implements OnInit, ControlValueAccessor, OnDestroy {
  @Input() nanotimeSupport = false;
  @Input() inputDisabled: boolean = false;
  @Input() inputInvalid: boolean = false;
  @Input() value: Date | string = null;
  @Input() clearBtn = false;
  @Input() field: FieldModel;
  @Input() stictFormat = false;
  @Output() valueChange = new EventEmitter<Date | string>();
  @ViewChild(SafeDatePickerValueDirective)
  private safeDatePickerValueDirective: SafeDatePickerValueDirective;

  @ViewChild(BsDatepickerDirective) private datePicker: BsDatepickerDirective;
  bsConfig$: Observable<Partial<BsDatepickerConfig>>;
  hasValue = false;
  private maxDate$ = new BehaviorSubject<Date>(null);
  private minDate$ = new BehaviorSubject<Date>(null);
  private timeZone$ = new BehaviorSubject<object>(null);
  private destroy$ = new Subject();
  private nanoSecondsValue: string;
  private globalFiltersValue: GlobalFilters;
  public valueInInput: string;

  constructor(
    private globalFiltersService: GlobalFiltersService,
    private cdRef: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>,
  ) {}

  @Input() set maxDate(maxDate: Date) {
    if (maxDate?.toString() !== 'Invalid Date') {
      const CURRENT_TIMEZONE = this.timeZone$.getValue() as TimeZone;

      if (maxDate && CURRENT_TIMEZONE) {
        maxDate = new Date(
          hdDateToTZ(
            new HdDate(new Date(maxDate)?.toISOString()),
            CURRENT_TIMEZONE?.name,
          ).toISOString(),
        );
      }
      this.maxDate$.next(maxDate);
    }
  }

  @Input() set timeZone(object: object) {
    this.timeZone$.next(object);
  }

  @Input() set minDate(minDate: Date) {
    const CURRENT_TIMEZONE = this.timeZone$.getValue() as TimeZone;

    if (minDate && !isNaN(minDate.valueOf()) && CURRENT_TIMEZONE) {
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
          dateInputFormat: this.nanotimeSupport ? dateInputFormat :
            dateInputFormat.replace(/S{9}/, 'SSS').replace(/S{6}/, 'SSS'),
          minDate: getDateUsingTZ(minDate, customTimeZone || filters.timezone[0]),
          maxDate: getDateUsingTZ(maxDate, customTimeZone || filters.timezone[0]),
        };
      }),
    );

    this.globalFiltersService.getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => this.globalFiltersValue = filters);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

    if (this.value) {
      const valueAsString = value instanceof Date ? value.toISOString() : value;

      if (this.nanotimeSupport) {
        this.saveNanoSeconds(valueAsString?.slice(0, valueAsString.length - 1));
      }
      this.valueInInput = formatHDate(
        valueAsString,
        this.globalFiltersValue.dateFormat,
        this.globalFiltersValue.timeFormat,
        this.globalFiltersValue.timezone,
        false,
      )
    } else {
      this.valueInInput = '';
    }

    if (!value) {
      this.safeDatePickerValueDirective?.setNull();
    }
    this.hasValue = !!value;
    this.cdRef.detectChanges();
  }

  onDateChange(value: Date, emitedByDatepicker = true) {
    if (emitedByDatepicker && this.stictFormat) {
      value.setHours(0, 0, 0, 0);
    }
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

    const dateInvalid = this.value.toString() === 'Invalid Date';

    if (emitedByDatepicker && !dateInvalid) {
      this.nanoSecondsValue = '';
    }
  
    let newDateValue: string;
    if (dateInvalid) {
      newDateValue = this.valueInInput ? 'Invalid Date' : '';
    } else if (this.nanotimeSupport) {
      newDateValue = this.value.toISOString().replace('Z', `${this.nanoSecondsValue}Z`);
    } else {
      newDateValue = this.value.toISOString();
    }
    this.valueChange.emit(newDateValue);
    this.onChange(newDateValue);
  
    if (emitedByDatepicker && !dateInvalid) {
      this.valueInInput = formatHDate(
        newDateValue,
        this.globalFiltersValue.dateFormat,
        this.globalFiltersValue.timeFormat,
        this.globalFiltersValue.timezone,
        false,
      )
    }
  }

  onInputValueChange(event) {
    const inputValue = event.target.value;
    this.valueInInput = inputValue;
    
    const subSeconds = inputValue.split('.').pop();
    const valueInvalid = inputValue.endsWith('.') || !(/\d/.test(subSeconds)) 
      || subSeconds.match(/\d+/)[0].length > (this.nanotimeSupport ? 9 : 3) || isNaN(parseInt(subSeconds));
    if (valueInvalid) {
      this.saveNanoSeconds('');
      this.onDateChange(new Date('Invalid date'), false);
    } else {
      if (this.nanotimeSupport) {
        this.saveNanoSeconds(inputValue);
      }
      const subSecondsValid = (!subSeconds.includes(':') && !!subSeconds.length);

      const timeFormat = this.globalFiltersValue.timeFormat[0];
      const formatWithoutMs = timeFormat.split(' ')[0].split('.')[0];
  
      let momentTimeFormat = subSecondsValid ? `${formatWithoutMs}.SSS` : formatWithoutMs;
      if (timeFormat.includes('tt')) {
        momentTimeFormat += ' a';
      }

      let formattingValue = inputValue;
      if (this.nanotimeSupport && subSeconds && subSecondsValid) {
        const valueAsArray = inputValue.split('.');
        valueAsArray.pop();
        formattingValue = `${valueAsArray.join('.')}.${subSeconds.slice(0, 3)}${subSeconds.match(/\D+/)?.[0] ?? ''}`;
      }

      const valueAsDate = moment(
        formattingValue, `${this.globalFiltersValue.dateFormat[0].toUpperCase()} ${momentTimeFormat}`, this.stictFormat).toDate();

      const timezone = this.timeZone$.getValue() as TimeZone;
      const localOffset = -valueAsDate.getTimezoneOffset();
      valueAsDate.setMilliseconds(valueAsDate.getMilliseconds() - ((timezone.offset - localOffset) * 60 * 1000));

      this.onDateChange(valueAsDate, false);
    }
  }

  clear() {
    this.valueInInput = null;
    this.nanoSecondsValue = '';
    this.value = null;
    this.valueChange.emit(this.value);
    this.onChange(null);
    this.safeDatePickerValueDirective.setNull();
    this.hasValue = false;
  }

  onChange(value: Date | string) {}

  openDropDown() {
    this.datePicker.placement = this.optimalPlacement();
    this.datePicker.toggle();
  }

  private optimalPlacement(): Placement {
    const calendarSize = 313;
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    if (rect.bottom + calendarSize < window.innerHeight) {
      return 'bottom';
    }

    if (rect.top - calendarSize > 0) {
      return 'top';
    }

    if (rect.right + calendarSize < window.innerWidth) {
      return 'right';
    }

    if (rect.left - calendarSize > 0) {
      return 'left';
    }

    return 'bottom';
  }

  private saveNanoSeconds(dateString: string) {
    if (dateString.includes('.')) {
      let nanoSecondsAsString = dateString.split('.').pop().slice(3);
      if (!nanoSecondsAsString.includes(':')) {
        nanoSecondsAsString = nanoSecondsAsString.match(/\d{1,6}/)?.[0] ?? '';  
        const nanoSecondsStringLength = nanoSecondsAsString.length;
        if (nanoSecondsStringLength < 6) {
          for (let i = 0; i < 6 - nanoSecondsStringLength; i++) {
            nanoSecondsAsString += '0';
          }
        }
        this.nanoSecondsValue = nanoSecondsAsString;
      } else {
        this.nanoSecondsValue = '';
      }
    } else {
      this.nanoSecondsValue = '';
    }
  }
}
