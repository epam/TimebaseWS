import {
  Component, ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
}                                                                         from '@angular/core';
import { ControlValueAccessor, UntypedFormControl, NG_VALUE_ACCESSOR }    from '@angular/forms';
import equal                                                                             from 'fast-deep-equal';
import { BehaviorSubject, combineLatest, Observable, of, ReplaySubject, Subject, timer } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
  switchMap,
  take, takeUntil,
  tap,
}                                                                                        from 'rxjs/operators';
import { AutocompleteComponent }                                          from '../../../../../../libs/deltix-ng-autocomplete/src/ts/components/autocomplete.component';
import { ClickOutsideService }                                            from '../../../../../../shared/directives/click-outside/click-outside.service';
import {
  BarChartPeriod,
  maxBarSize,
}                                                                         from '../../../../../../shared/models/bar-chart-period';
import { PeriodsService }                                                 from '../../../../../../shared/services/periods.service';

interface PeriodUnit {
  aggregation: number;
  variants: string[];
  maxNumber: number;
  submitUnit: string;
}

@Component({
  selector: 'app-bars-period-filter',
  templateUrl: './bars-period-filter.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => BarsPeriodFilterComponent),
    },
  ],
})
export class BarsPeriodFilterComponent implements OnInit, ControlValueAccessor, OnDestroy {
  @ViewChild(AutocompleteComponent) private autocomplete: AutocompleteComponent;
  
  @Output() periodManuallyChange = new EventEmitter<BarChartPeriod>();
  @Output() periodAutoChange = new EventEmitter<BarChartPeriod>();
  
  @Input() set minInterval(minInterval) {
    this.minInterval$.next(minInterval);
  }
  
  @Input() set maxInterval(maxInterval) {
    this.maxInterval$.next(Math.max(maxInterval, 7 * 24 * 60 * 60 * 1000));
  }
  
  @Input() periodicity: number;
  
  @Input() cssClass: string;
  @Input() fillOnNull = true;
  
  values$: Observable<string[]>;
  control = new UntypedFormControl();
  inputString$ = new BehaviorSubject<string>('');
  private minInterval$ = new BehaviorSubject<number>(0);
  private maxInterval$ = new BehaviorSubject<number>(maxBarSize);
  private onChangeRegistered$ = new ReplaySubject(1);
  private units: PeriodUnit[] = [
    {
      aggregation: 1000,
      variants: ['s', 'sec', 'second', 'seconds'],
      maxNumber: 59,
      submitUnit: 'SECOND',
    },
    {
      aggregation: 60 * 1000,
      variants: ['min', 'minute', 'minutes'],
      maxNumber: 59,
      submitUnit: 'MINUTE',
    },
    {
      aggregation: 60 * 60 * 1000,
      variants: ['h', 'hour', 'hours'],
      maxNumber: 23,
      submitUnit: 'HOUR',
    },
    {
      aggregation: 24 * 60 * 60 * 1000,
      variants: ['d', 'day', 'days'],
      maxNumber: 30,
      submitUnit: 'DAY',
    },
    {
      aggregation: 7 * 24 * 60 * 60 * 1000,
      variants: ['w', 'week', 'weeks'],
      maxNumber: 52,
      submitUnit: 'WEEK',
    },
    {
      aggregation: 30 * 24 * 60 * 60 * 1000,
      variants: ['month', 'months'],
      maxNumber: 12,
      submitUnit: 'MONTH',
    },
    {
      aggregation: 90 * 24 * 60 * 60 * 1000,
      variants: ['q', 'quarter', 'quarters'],
      maxNumber: 12,
      submitUnit: 'QUARTER',
    },
    {
      aggregation: 365 * 24 * 60 * 60 * 1000,
      variants: ['y', 'year', 'years'],
      maxNumber: 10,
      submitUnit: 'YEAR',
    },
  ];
  
  private destroy$ = new Subject<void>();
  private lastValue: string;
  
  constructor(
    private periodsService: PeriodsService,
    private elementRef: ElementRef<HTMLElement>,
    private clickOutsideService: ClickOutsideService,
  ) {}
  
  ngOnInit(): void {
    this.clickOutsideService.onOutsideClick(this.elementRef.nativeElement).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateOnOutsideClick();
    });
    const periodsData$ = combineLatest([
      this.periodsService.getPeriods(),
      this.minInterval$,
      this.maxInterval$,
      this.onChangeRegistered$.pipe(take(1)),
    ]).pipe(
      distinctUntilChanged(equal),
      map(([periods, minInterval, maxInterval]) => {
        const filtered = periods.filter(
          (period) => period.aggregation >= minInterval && period.aggregation <= maxInterval,
        );
        
        if (!filtered.length) {
          const period =
            this.units.reverse().find((p) => minInterval / p.aggregation >= 1) ||
            this.units[this.units.length - 1];
          const num = Math.floor(minInterval / period.aggregation);
          const name = `${num} ${period.variants[period.variants.length - (num > 1 ? 1 : 2)]}`;
          return [{aggregation: minInterval, name}];
        }
        
        return filtered;
      }),
      shareReplay(1),
    );
    
    if (this.fillOnNull) {
      periodsData$.pipe(take(1)).subscribe((periods) => {
        if (!this.lastValue) {
          let period = periods.find((p) => this.periodicity === p.aggregation);
          period = period || periods.find((p) => p.aggregation >= 60 * 1000);
          this.lastValue = period.name;
          this.control.patchValue(period.name);
          this.onChange(period);
          this.periodAutoChange.next(period);
        }
      });
    }
    
    this.values$ = combineLatest([
      this.inputString$.pipe(
        startWith(''),
        tap((val) => this.autocomplete?.openDropdown()),
      ),
      this.minInterval$,
      this.maxInterval$,
    ]).pipe(
      distinctUntilChanged(equal),
      switchMap(([text, minInterval, maxInterval]) => {
        if (!text) {
          return periodsData$.pipe(map((periods) => periods.map((period) => period.name)));
        }
        
        const {number, units} = this.parseText(text);
        if (!number) {
          return of([]);
        }
        
        const availableUnits = this.units.filter((u) => u.aggregation * number >= minInterval);
        
        return of(
          availableUnits
            .map((u) => {
              const unitVal = u.variants.find((v) => v.toLowerCase().startsWith(units));
              return unitVal && u.maxNumber >= number && number * u.aggregation <= maxInterval
                ? `${number} ${unitVal}`
                : null;
            })
            .filter(Boolean),
        );
      }),
    );
  }
  
  onChangeInput(text: string) {
    this.inputString$.next(text);
  }
  
  registerOnChange(fn: any): void {
    this.onChange = fn;
    this.onChangeRegistered$.next();
  }
  
  registerOnTouched(fn: any): void {}
  
  writeValue(value: BarChartPeriod): void {
    if (!value) {
      return;
    }
    
    this.lastValue = value.name;
    this.control.patchValue(value.name);
  }
  
  apply(value: string = null) {
    const val = value || this.inputString$.getValue();
    
    this.autocomplete.closeDropDown();
    
    const validated = this.validUnitAndNumber(val);
    
    if (!validated) {
      this.control.patchValue(this.lastValue);
      return;
    }
    
    const {unit, number, aggregation} = validated;
    
    this.lastValue = val;
    const controlValue = {aggregation, name: val, units: unit.submitUnit, number};
    this.onChange(controlValue);
    this.periodManuallyChange.next(controlValue);
  }
  
  validateOnOutsideClick() {
    const validated = this.validUnitAndNumber(this.inputString$.getValue());
    if (!validated) {
      this.control.patchValue(this.lastValue);
      this.inputString$.next('');
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private validUnitAndNumber(text: string): { unit: PeriodUnit, number: number, aggregation: number } {
    const {number, units} = this.parseText(text);
    const unit = this.units.find((u) =>
      u.variants.find((v) => v.toLowerCase().trim() === units.toLowerCase().trim()),
    );
    
    if (!unit || !number) {
      return null;
    }
    
    const aggregation = unit.aggregation * number;
    
    if (
      aggregation < this.minInterval$.getValue() ||
      aggregation > Math.min(maxBarSize, this.maxInterval$.getValue())
    ) {
      return null;
    }
    
    return {unit, number, aggregation};
  }
  
  private parseText(text: string): { number: number; units: string } {
    const number = text.replace(/\s/g, '');
    const match = number.match(/^\d+/g);
    const numberEnd = match ? match[0].length : 0;
    
    return {number: Number(number.slice(0, numberEnd)), units: number.slice(numberEnd)};
  }
  
  private onChange(value: BarChartPeriod) {}
}
