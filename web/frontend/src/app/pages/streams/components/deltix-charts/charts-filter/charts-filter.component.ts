import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {select, Store} from '@ngrx/store';
import equal from 'fast-deep-equal';
import {BsDatepickerConfig} from 'ngx-bootstrap/datepicker';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {combineLatest, Observable, Subject} from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import {AutocompleteComponent} from 'src/app/libs/deltix-ng-autocomplete/src/ts/components/autocomplete.component';
import {AppState} from '../../../../../core/store';
import {getFormatSeparator} from '../../../../../shared/locale.timezone';
import {BarChartPeriod} from '../../../../../shared/models/bar-chart-period';
import {GlobalFilters} from '../../../../../shared/models/global-filters';
import {GlobalFiltersService} from '../../../../../shared/services/global-filters.service';
import {StreamsService} from '../../../../../shared/services/streams.service';
import {SymbolsService} from '../../../../../shared/services/symbols.service';
import {formatDateTime} from '../../../../../shared/utils/formatDateTime';
import {dateToUTC, getTimeZoneOffset} from '../../../../../shared/utils/timezone.utils';
import {ChartTypes} from '../../../models/chart.model';
import {FilterModel, WIDTH_VALUES_MS} from '../../../models/filter.model';
import {GlobalFilterTimeZone} from '../../../models/global.filter.model';
import {TabModel} from '../../../models/tab.model';
import {ChartTrackService} from '../../../services/chart-track.service';
import * as StreamDetailsActions from '../../../store/stream-details/stream-details.actions';
import * as StreamsTabsActions from '../../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
  getLoadingState,
} from '../../../store/streams-tabs/streams-tabs.selectors';
import {toUtc} from '../../stream-details/stream-details.component';
import {DeltixChartFeedService} from '../chart-parts/detix-chart-feed.service';
import {barWidthDefault, timestampToDay, zoomLimits} from '../charts/deltix-chart-zoom-limits';

@Component({
  selector: 'app-charts-filter',
  templateUrl: './charts-filter.component.html',
  styleUrls: ['./charts-filter.component.scss'],
})
export class ChartsFilterComponent implements OnInit, OnDestroy {
  @ViewChild('customRangePicker') customRangePicker: TemplateRef<HTMLElement>;
  @ViewChild(AutocompleteComponent) levelsAutocomplete: AutocompleteComponent;

  public filterForm: FormGroup;
  public chartTypes$: Observable<{id: string; title: string}[]>;
  public widthValuesMs$;
  public showLevels$: Observable<boolean>;
  public loadingDataState$: Observable<boolean>;
  public filterState$: Observable<FilterModel>;
  public globalSettings$: Observable<GlobalFilters>;
  public currentTab$: Observable<TabModel>;
  public getTitle$: Observable<string>;
  public lvlValues = [1, 5, 10, 20, 50, 100];
  public levels: number;
  public date_format: string;
  public time_format: string;
  public datetime_separator: string;
  public format: string;
  public bsFormat: string;
  public modalRef: BsModalRef;
  public bsConfig: Partial<BsDatepickerConfig>;
  public bsInlineRangeValue: Date[];
  public rangeFromValue: Date;
  public rangeToValue: Date;
  minInterval$: Observable<number>;
  maxInterval$: Observable<number>;
  showBarsChart$: Observable<boolean>;
  timeRangeError = false;
  timeRangeLimits: {from: string; to: string};
  hideFilters$: Observable<boolean>;
  track$: Observable<boolean>;
  periodicity$: Observable<number>;

  private filter_timezone: GlobalFilterTimeZone;
  private destroy$ = new Subject();
  private levelsChange$ = new Subject<string>();
  private levelInput: string;
  private previousStreamRange: {start: number; end: number};
  private isFirstBarSubmit = false;

  constructor(
    private appStore: Store<AppState>,
    private fb: FormBuilder,
    private streamsService: StreamsService,
    private symbolsService: SymbolsService,
    private activatedRoute: ActivatedRoute,
    private globalFiltersService: GlobalFiltersService,
    private modalService: BsModalService,
    private chartTrackService: ChartTrackService,
    private deltixChartFeedService: DeltixChartFeedService,
  ) {}

  ngOnInit(): void {
    this.chartTypes$ = this.appStore.pipe(
      select(getActiveTab),
      filter(Boolean),
      map((tab: TabModel) => tab?.chartType),
      distinctUntilChanged(equal),
      map((types) => (types ? types.map((type) => ({id: type, title: type})) : null)),
    );

    this.currentTab$ = this.appStore.pipe(select(getActiveOrFirstTab));
    this.filterState$ = this.appStore.pipe(select(getActiveTabFilters));
    this.globalSettings$ = this.globalFiltersService.getFilters();
    this.loadingDataState$ = this.deltixChartFeedService.onLoading();

    this.filterForm = this.fb.group({
      width: [],
      chart_type: [],
      period: null,
    });

    this.track$ = this.chartTrackService.onTrack();

    this.showLevels$ = this.filterState$.pipe(
      map((filter) => filter?.chart_type === ChartTypes.PRICES_L2),
    );

    const props$ = this.activatedRoute.params.pipe(
      switchMap(({symbol, stream}) => this.symbolsService.getProps(stream, symbol)),
      filter(({props}) => !!props.periodicity),
      shareReplay(1),
    );

    this.periodicity$ = props$.pipe(
      map(({props}) => Number(props.periodicity.milliseconds) || 60 * 1000),
    );

    this.minInterval$ = props$.pipe(
      map(({props}) => Number(props.periodicity.milliseconds) || 1000),
      shareReplay(1),
    );

    this.maxInterval$ = this.activatedRoute.params.pipe(
      switchMap(({symbol, stream, space}) =>
        this.streamsService.rangeCached(stream, symbol, space),
      ),
      switchMap((range) => {
        return this.deltixChartFeedService.onEndOfStream().pipe(
          filter((end) => !!end),
          startWith(new Date(range.end).getTime()),
          map((end) => ({
            end,
            start: new Date(range.start).getTime(),
          })),
        );
      }),
      map(({end, start}) => end - start),
      shareReplay(1),
    );

    this.showBarsChart$ = combineLatest([
      this.filterState$,
      this.minInterval$,
      this.maxInterval$,
    ]).pipe(
      map(([filter, minInterval, maxInterval]) => {
        return minInterval && maxInterval && filter?.chart_type === ChartTypes.BARS;
      }),
    );

    const zoomLimits$ = combineLatest([
      this.showBarsChart$,
      this.filterForm
        .get('period')
        .valueChanges.pipe(startWith(this.filterForm.get('period').value)),
    ]).pipe(
      map(([isBarChart, period]: [boolean, BarChartPeriod]) => {
        if (!isBarChart || !period) {
          return null;
        }

        return zoomLimits(period.aggregation);
      }),
    );

    this.widthValuesMs$ = zoomLimits$.pipe(
      map((limits) => {
        if (!limits) {
          return WIDTH_VALUES_MS;
        }

        return WIDTH_VALUES_MS.filter(
          (value) =>
            value.val === 'custom' ||
            (value.val >= limits[0] && (value.val <= limits[1] || limits[1] === null)),
        );
      }),
    );

    this.filterState$.pipe(takeUntil(this.destroy$)).subscribe((filters) => {
      if (filters?.period) {
        if (filters.period !== this.filterForm.get('period').value) {
          this.filterForm.get('period').patchValue(filters.period);
        }
      }
    });

    this.globalSettings$.pipe(takeUntil(this.destroy$)).subscribe((filters) => {
      const filter_date_format = filters.dateFormat[0];
      const filter_time_format = filters.timeFormat[0];
      const oldTz = this.filter_timezone?.name;

      if (filters.timezone && filters.timezone.length) {
        this.filter_timezone = filters.timezone[0];
      } else {
        this.filter_timezone = null;
      }

      if (this.rangeFromValue && this.rangeToValue && this.filter_timezone && oldTz) {
        this.setModalRangesFromUtc(
          dateToUTC(this.rangeFromValue, oldTz).toISOString(),
          dateToUTC(this.rangeToValue, oldTz).toISOString(),
        );
      }

      this.date_format = filter_date_format;
      this.time_format = filter_time_format;
      this.datetime_separator = getFormatSeparator(this.date_format);

      this.format = filter_date_format + ' ' + filter_time_format;
      this.bsFormat = filter_date_format.toUpperCase() + ' ' + filter_time_format;
      this.bsFormat = this.bsFormat.replace('tt', 'A');
      this.bsFormat = this.bsFormat.replace(/f/g, 'S');

      this.bsConfig = Object.assign(
        {},
        {
          containerClass: 'theme-default',
          dateInputFormat: this.bsFormat,
        },
      );
    });

    this.hideFilters$ = this.filterState$.pipe(map((filter) => !filter?.from || !filter.to));

    this.getTitle$ = combineLatest([this.globalSettings$, this.filterState$]).pipe(
      map(([settings, filter]) => filter),
      filter((filter) => Boolean(filter?.from && filter?.to)),
      map((filter) => {
        return `${formatDateTime(
          filter.from,
          this.format,
          this.filter_timezone.name,
        )}  -  ${formatDateTime(filter.to, this.format, this.filter_timezone.name)}`;
      }),
    );

    this.currentTab$
      .pipe(
        filter((TAB) => Boolean(TAB?.streamRange && TAB?.chartType?.length)),
        filter((TAB) => Boolean(TAB.filter && TAB.filter?.from && TAB.filter?.to)),
        withLatestFrom(this.globalFiltersService.getFilters()),
        takeUntil(this.destroy$),
      )
      .subscribe(([TAB]) => {
        const tabFilter = TAB.filter;
        if (!tabFilter.silent) {
          this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
        }
        let formIsChanged = false;
        const CHART_TYPE_CONTROL = this.filterForm.get('chart_type'),
          CHART_TYPE_CONTROL_VALUE = CHART_TYPE_CONTROL.value;
        if (
          !tabFilter.chart_type ||
          tabFilter.chart_type !== CHART_TYPE_CONTROL_VALUE ||
          !TAB.chartType.includes(CHART_TYPE_CONTROL_VALUE)
        ) {
          CHART_TYPE_CONTROL.setValue(
            TAB.chartType.includes(tabFilter.chart_type) ? tabFilter.chart_type : TAB.chartType[0],
          );
          this.isFirstBarSubmit = TAB.chartType[0] === ChartTypes.BARS;
          formIsChanged = true;
        }

        this.filterForm.get('width').setValue(tabFilter.chart_width_val);

        this.setModalRangesFromUtc(tabFilter.from, tabFilter.to);
        if (CHART_TYPE_CONTROL.value === ChartTypes.PRICES_L2) {
          if (this.levels !== tabFilter['levels'] || typeof this.levels === 'undefined') {
            this.levels = tabFilter['levels'] || this.levels || this.lvlValues[2];
            formIsChanged = true;
          }
        } else {
          this.levels = null;
        }

        if (formIsChanged && !tabFilter.silent) {
          this.onFilterSubmit(
            tabFilter.from && tabFilter.to
              ? [new Date(tabFilter.from).getTime(), new Date(tabFilter.to).getTime()]
              : null,
          );
        }
      });

    this.levelsChange$
      .pipe(
        takeUntil(this.destroy$),
        map((value) => (value === null || !/^\d+$/.test(value) ? null : value)),
        filter(Boolean),
        distinctUntilChanged(),
      )
      .subscribe((value) => {
        this.levels = parseInt(value as string, 10);
        this.onFilterSubmit();
      });

    combineLatest([
      this.filterState$,
      this.filterForm.valueChanges.pipe(
        startWith(this.filterForm.value),
        filter((form) => !!form.chart_type),
      ),
    ])
      .pipe(
        map(([filters]) => filters?.chart_type),
        distinctUntilChanged(),
        withLatestFrom(this.filterState$),
        filter(([chartType, filters]) => chartType === ChartTypes.BARS && !!filters.period),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.checkBarLimits();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  public onTimeRangeChange() {
    if (this.filterForm.get('width').value === 'range') return;
    if (this.filterForm.get('width').value === 'custom') {
      this.showRangePicker();
    } else {
      this.filtersManuallyChanged();
      this.onFilterSubmit();
    }
    this.filterForm.get('width').setValue('range');
  }

  public hideModal(updateData?: boolean) {
    if (updateData) {
      this.filtersManuallyChanged();
      this.onFilterSubmit([
        dateToUTC(this.rangeFromValue, this.filter_timezone.name).getTime(),
        dateToUTC(this.rangeToValue, this.filter_timezone.name).getTime(),
      ]);
    }
    if (this.modalRef) this.modalRef.hide();
    this.modalRef = null;
  }

  onChartTypeChange() {
    this.filtersManuallyChanged();
    this.onFilterSubmit();
  }

  public onFilterSubmit(startEndDate?: number[], silent?: boolean) {
    const FILTER: {[key: string]: any} = this.filterForm.value;
    FILTER['chart_width_val'] = this.filterForm.get('width').value;

    this.tabWithRange()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(({filter, streamRange}) => {
        let startDate, endDate;

        if (
          typeof FILTER['chart_width_val'] === 'string' &&
          !/\D/gi.test(FILTER['chart_width_val'])
        ) {
          FILTER['chart_width_val'] = parseInt(FILTER['chart_width_val'], 10);
        }

        if (!startEndDate) {
          if (typeof FILTER['chart_width_val'] === 'number') {
            [startDate, endDate] = this.getStartDate(
              streamRange?.end || new Date().getTime(),
              FILTER['chart_width_val'],
            );
          }
        } else {
          [startDate, endDate] = [...startEndDate];
        }

        if (startDate) {
          this.rangeFromValue = this.addLocalTimezone(this.normalizeTz(new Date(startDate)));
          FILTER['from'] = new Date(startDate).toISOString();
        }
        if (endDate) {
          this.rangeToValue = this.addLocalTimezone(this.normalizeTz(new Date(endDate)));
          FILTER['to'] = new Date(endDate).toISOString();
        }

        if (this.levels && !isNaN(parseInt(this.levels + '', 10))) {
          FILTER['levels'] = parseInt(this.levels + '', 10);
        }

        this.bsInlineRangeValue = [this.rangeFromValue, this.rangeToValue];
        if (!silent) {
          this.appStore.dispatch(
            new StreamsTabsActions.SetFilters({
              filter: {
                ...(filter || {}),
                ...FILTER,
                silent: false,
              },
            }),
          );
        }
      });
  }

  public switchTimeRange(i: number) {
    this.filtersManuallyChanged();
    this.filterState$
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe((tabFilter: FilterModel) => {
        let startEndDate;
        const FROM = new Date(tabFilter.from).getTime(),
          TO = new Date(tabFilter.to).getTime(),
          WIDTH = TO - FROM;
        if (i > 0) {
          startEndDate = [TO, TO + WIDTH];
        } else {
          startEndDate = [FROM - WIDTH, FROM];
        }

        this.onFilterSubmit(startEndDate);
      });
  }

  onLevelsModelChange(value: string = null, validate = false) {
    this.levelInput = value || this.levelInput;
    if (!this.levelInput) {
      return;
    }
    this.onLevelsManuallyChanged();
    this.levelsChange$.next(this.levelInput);

    this.levelsAutocomplete?.closeDropDown();
    if (validate && Number(this.levelInput) !== this.levels) {
      this.levelsAutocomplete.selectedText = this.levels.toString();
    }
  }

  private onLevelsManuallyChanged() {
    const oldLevels = this.levels;
    this.levelsChange$.pipe(take(1)).subscribe(() => {
      if (oldLevels !== this.levels) {
        this.filtersManuallyChanged();
      }
    });
  }

  onLevelChangeInput(value: string) {
    this.levelInput = value;
    this.levelsAutocomplete?.openDropdown();
  }

  public onRangeFromChange(date: Date) {
    this.rangeFromValue = this.rangeToValue > date ? date : new Date(this.rangeToValue);
    this.bsInlineRangeValue = [this.rangeFromValue, this.bsInlineRangeValue?.[1]];
  }

  public onRangeToChange(date: Date) {
    this.rangeToValue = this.rangeFromValue < date ? date : new Date(this.rangeFromValue);
    this.bsInlineRangeValue = [this.bsInlineRangeValue?.[0], this.rangeToValue];
  }

  public onRangeChangeEvent(dates: Date[]) {
    this.rangeFromValue = dates[0];
    this.rangeToValue = dates[1];
    this.validateTimeRange();
  }

  onBarsPeriodSubmit() {
    this.filtersManuallyChanged();
    this.checkBarLimits();
  }

  toggleTrack() {
    this.chartTrackService.track(!this.chartTrackService.value());
  }

  setConfig() {
    const RANGE: Date[] = [null, null];
    RANGE[0] = this.rangeFromValue = new Date(this.rangeFromValue);
    RANGE[1] = this.rangeToValue = new Date(this.rangeToValue);
    this.bsInlineRangeValue = RANGE;
  }

  private checkBarLimits() {
    combineLatest([this.tabWithRange(), this.globalFiltersService.getFilters()])
      .pipe(take(1))
      .subscribe(([{filter, streamRange}]) => {
        const {from, to} = filter;
        const fromTime = new Date(from).getTime();
        // to and streamRange.end can be different on first load of bars chart
        const toTime = this.isFirstBarSubmit ? streamRange.end : new Date(to).getTime();
        const currentWidth = toTime - fromTime;
        const middleTime = currentWidth / 2 + fromTime;
        const aggregation = this.filterForm.get('period').value?.aggregation;
        const [limitFrom, limitTo] = zoomLimits(aggregation);

        let zoomTo = null;
        if (limitTo !== null && currentWidth > limitTo) {
          zoomTo = limitTo;
        }

        if (currentWidth < limitFrom) {
          zoomTo = limitFrom;
        }

        if (this.isFirstBarSubmit) {
          zoomTo = barWidthDefault(aggregation);
        }

        let startEndDate = [fromTime, toTime];

        if (zoomTo) {
          startEndDate = this.isFirstBarSubmit
            ? [toTime - zoomTo, toTime]
            : [middleTime - zoomTo / 2, middleTime + zoomTo / 2];
        }

        // If after bar change user see no data, we move him see end of stream in middle of screen
        if (!zoomTo && !this.isFirstBarSubmit && new Date(from).getTime() > streamRange.end) {
          startEndDate = [streamRange.end - currentWidth / 2, streamRange.end + currentWidth / 2];
        }

        this.onFilterSubmit(startEndDate);

        this.isFirstBarSubmit = false;
      });
  }

  private tabWithRange(): Observable<{
    streamRange: {start: number; end: number};
    filter: FilterModel;
    previousStreamRange: {start: number; end: number};
  }> {
    return this.currentTab$.pipe(
      switchMap((tab) =>
        this.streamsService
          .rangeCached(
            tab.stream,
            tab.symbol,
            tab.space,
            this.filterForm.get('period').value?.aggregation,
          )
          .pipe(
            take(1),
            map((range) => ({
              streamRange: {
                start: new Date(range.start).getTime(),
                end: new Date(range.end).getTime(),
              },
              filter: tab.filter,
              previousStreamRange: this.previousStreamRange,
            })),
            tap((data) => (this.previousStreamRange = data.streamRange)),
          ),
      ),
    );
  }

  private setModalRangesFromUtc(from: string, to: string) {
    this.rangeFromValue = this.addLocalTimezone(this.normalizeTz(new Date(from)));
    this.rangeToValue = this.addLocalTimezone(this.normalizeTz(new Date(to)));
  }

  private validateTimeRange() {
    const filter = this.filterForm.value;
    if (filter.chart_type !== ChartTypes.BARS || !filter.period?.aggregation) {
      this.timeRangeError = false;
      return;
    }

    const [limitFrom, limitTo] = zoomLimits(filter.period.aggregation);
    const chosenRange = this.rangeToValue.getTime() - this.rangeFromValue.getTime();
    this.timeRangeError = chosenRange < limitFrom || (chosenRange > limitTo && limitTo !== null);
    this.timeRangeLimits = {from: timestampToDay(limitFrom), to: timestampToDay(limitTo)};
  }

  private filtersManuallyChanged() {
    this.chartTrackService.track(false);
  }

  private addLocalTimezone(date: Date): Date {
    const offset = getTimeZoneOffset(this.filter_timezone.name);
    return new Date(toUtc(date.toISOString()).getEpochMillis() + offset * 60 * 1000);
  }

  private showRangePicker() {
    if (this.modalRef) {
      return;
    }

    this.tabWithRange()
      .pipe(take(1))
      .subscribe(({filter}) => {
        this.modalRef = this.modalService.show(this.customRangePicker);
        this.rangeFromValue = new Date(filter.from);
        this.rangeToValue = new Date(filter.to);
      });
  }

  private normalizeTz(date: Date): Date {
    const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
    const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    const isDaySafeTime = Math.max(jan, jul) !== date.getTimezoneOffset();
    if (isDaySafeTime) {
      return new Date(date.getTime() - 60 * 60 * 1000);
    }
    return date;
  }

  private getStartDate(endDate: number, width: number | string): number[] {
    let startDate = endDate - 1,
      tempDate;
    const NEW_END_DATE = endDate;

    switch (typeof width) {
      case 'number':
        startDate = endDate - width;
        break;
      case 'string':
        switch (width) {
          case 'range':
          case 'custom':
            break;
          case 'yesterday':
            break;
          case 'before_yesterday':
            break;
          default:
            tempDate = new Date(endDate);
            if (/month/gi.test(width)) {
              tempDate.setMonth(tempDate.getMonth() - parseInt(width.split(':')[1], 10));
            } else if (/year/gi.test(width)) {
              tempDate.setFullYear(tempDate.getFullYear() - parseInt(width.split(':')[1], 10));
            }
            startDate = tempDate.getTime();
            break;
        }
        break;
      default:
        break;
    }

    return [startDate, NEW_END_DATE];
  }
}
