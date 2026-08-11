import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  Input,
  Output, EventEmitter, OnChanges, SimpleChanges
}                                                      from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup }         from '@angular/forms';
import { select, Store }                              from '@ngrx/store';
import equal                                           from 'fast-deep-equal';
import { BsDatepickerConfig }                          from 'ngx-bootstrap/datepicker';
import { BsModalRef, BsModalService }                  from 'ngx-bootstrap/modal';
import { combineLatest, Observable, Subject, of, BehaviorSubject, fromEvent }   from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map, publishReplay, refCount,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
  pluck, skip
} from 'rxjs/operators';
import { AutocompleteComponent }                       from 'src/app/libs/deltix-ng-autocomplete/src/ts/components/autocomplete.component';
import { AppState }                                    from '../../../../../core/store';
import { getFormatSeparator }                          from '../../../../../shared/locale.timezone';
import { GlobalFilters }                               from '../../../../../shared/models/global-filters';
import { GlobalFiltersService }                        from '../../../../../shared/services/global-filters.service';
import { StreamsService }                              from '../../../../../shared/services/streams.service';
import { SymbolsService }                              from '../../../../../shared/services/symbols.service';
import { TabStorageService }                           from '../../../../../shared/services/tab-storage.service';
import { formatDateTime }                              from '../../../../../shared/utils/formatDateTime';
import { dateToUTC, getTimeZoneOffset }                from '../../../../../shared/utils/timezone.utils';
import { barChartTypes, ChartTypes }                   from '../../../models/chart.model';
import { FilterModel, WIDTH_VALUES_MS, defaultTimeRangeList }                from '../../../models/filter.model';
import { GlobalFilterTimeZone }                        from '../../../models/global.filter.model';
import { TabModel }                                    from '../../../models/tab.model';
import { ChartExchangeService }                        from '../../../services/chart-exchange.service';
import { ChartTrackService }                           from '../../../services/chart-track.service';
import { StreamSourceService } from '../../../services/stream-source.service';
import * as StreamDetailsActions                       from '../../../store/stream-details/stream-details.actions';
import * as StreamsTabsActions                         from '../../../store/streams-tabs/streams-tabs.actions';
import {
  chartTabNumber,
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
}                                                      from '../../../store/streams-tabs/streams-tabs.selectors';
import { toUtc }                                       from '../../stream-details/stream-details.component';
import { DeltixChartFeedService }                      from '../chart-parts/detix-chart-feed.service';
import { barWidthDefault, timestampToDay, zoomLimits } from '../charts/deltix-chart-zoom-limits';
import { ChartScrollService } from '../../../services/chart-scroll.service';
import { MultiSelectItem } from 'src/app/shared/components/multi-select/multi-select-item';
import { ShareLinkService } from 'src/app/shared/services/share-link.service';
import { StorageService } from 'src/app/shared/services/storage.service';
import { ChartService } from 'src/app/shared/services/chart-service';
import { PeriodicityType } from '../../../models/periodicity-type';

@Component({
  selector: 'app-charts-filter',
  templateUrl: './charts-filter.component.html',
  styleUrls: ['./charts-filter.component.scss'],
})
export class ChartsFilterComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('customRangePicker') customRangePicker: TemplateRef<HTMLElement>;
  @ViewChild(AutocompleteComponent) levelsAutocomplete: AutocompleteComponent;

  @Input() symbolList: string[] = [];

  @Output() setSelectedSymbols = new EventEmitter<string[]>();
  
  public filterForm: UntypedFormGroup;
  public chartTypes: { id: string; title: string }[];
  public chartTitles: string[];
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
  customRangeFromValue: Date;
  customRangeToValue: Date;
  minInterval$: Observable<number>;
  maxInterval$: Observable<number>;
  showBarsChart$: Observable<boolean>;
  timeValueError = {
    start: false,
    end: false
  };
  timeRangeError = false;
  timeRangeLimits: { from: string; to: string };
  hideFilters$: Observable<boolean>;
  track$: Observable<boolean>;
  periodicity$: Observable<number>;
  exchanges$: Observable<{ id: string; name: string; disabled: boolean }[]>;
  exchangeControl = new UntypedFormControl();
  sourceOptions: { [key: string]: string[] } = {};
  symbols$: Observable<MultiSelectItem[]>;
  selectedSymbols: MultiSelectItem[];
  symbolsTooltipText: string;
  shareUrl: string;

  private exchanges;
  private streamId: string;
  private tabId: string;
  private symbolName: string;
  private filter_timezone: GlobalFilterTimeZone;
  private destroy$ = new Subject();
  private levelsChange$ = new Subject<string>();
  private levelInput: string;
  private previousStreamRange: { start: number; end: number };
  private isFirstBarSubmit = false;
  private loadedSources = new Set<string>();
  private lastFilterState: FilterModel;
  private minInterval: number = 0;
  private newTabSwitchesNumber: number = 0;
  private symbolList$ = new Subject<string[]>();
  private space: string;
  private periodicityInMilliseconds: number = 0;
  private scrollRange: { start: string, end: string, tabId: string };
  private currentChartTab: string;
  private tabSymbolList = {};
  private lastOpenedTab: TabModel;
  private currentRange: string[];
  private filterRange: string[];
  private maxDefaultRangeValue: number;
  private shortSelectedRange$ = new BehaviorSubject(false);
  private chartTypeChanged = false;
  
  constructor(
    private appStore: Store<AppState>,
    private fb: UntypedFormBuilder,
    private streamsService: StreamsService,
    private symbolsService: SymbolsService,
    private globalFiltersService: GlobalFiltersService,
    private modalService: BsModalService,
    private chartTrackService: ChartTrackService,
    private chartScrollService: ChartScrollService,
    private deltixChartFeedService: DeltixChartFeedService,
    private tabStorage: TabStorageService<{ track: boolean; exchange: { id: string; name: string } }>,
    private chartExchangeService: ChartExchangeService,
    private cdRef: ChangeDetectorRef,
    private streamSourceService: StreamSourceService,
    private shareLinkService: ShareLinkService,
    private storageService: StorageService,
    private chartService: ChartService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.symbolList?.currentValue?.length) {
      this.symbolList$.next(changes.symbolList.currentValue);
      this.selectedSymbols = changes.symbolList.currentValue.map((symbol: string) => ({id: symbol, name: symbol }) );

      this.filterForm?.patchValue( { symbol: this.selectedSymbols } );
      this.updateTab();

      if (changes.symbolList.currentValue.length < changes.symbolList.previousValue?.length && this.exchanges) {
        this.deltixChartFeedService.symbolExchangesSubject.next(this.exchanges);
        this.streamsService.symbolListUpdated.next();
      }
    }
  }
  
  ngOnInit(): void {
    this.symbolList$
      .pipe(filter((list: string[]) => list.length > 1), takeUntil(this.destroy$))
      .subscribe(list => {
        const savedSymbols = this.chartService.getSavedSymbolList(this.tabId);
        if (!savedSymbols) {
          this.chartService.updateSavedSymbolList(this.tabId, list);
        } 
      });

    fromEvent(window, 'beforeunload')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.saveChartSettings());

    this.subscribeExchanges();
    
    this.tabSymbolList = this.chartService.tabSymbolList;
    
    this.appStore.pipe(
      select(getActiveTab),
      filter(Boolean),
      tap((tab: TabModel) => this.tabId = tab.id),
      map((tab: TabModel) => [tab?.chartType, tab?.chartTypeTitles]),
      distinctUntilChanged(equal),
      filter(([types, titles]) => types && titles),
      map(([types, titles]) => types ? types.map((type, index) => ({id: type, title: titles[index]})) : null),
      takeUntil(this.destroy$)
    ).subscribe(chartTypes => {
      this.chartTypes = chartTypes;
      this.chartTitles = chartTypes.map(chart => chart.title.toUpperCase());
    });

    this.currentTab$ = this.appStore.pipe(select(getActiveOrFirstTab));
    this.filterState$ = this.appStore
      .pipe(
        select(getActiveTab),
        filter(tab => !!tab?.filter.chart_type),
        distinctUntilChanged((t1, t2) => JSON.stringify(t1.filter) === JSON.stringify(t2.filter)),
        map(({ id, filter }) => {
          if (!this.chartService.chartFilterFormTouched.has(id) && !this.streamsService.chartDraggedOrZoomed && this.newTabSwitchesNumber < 2) {
            const tabIndex = this.storageService.getTabs().findIndex(tab => tab.id === id);
            const storageKey = `${this.streamId}_${tabIndex}`;
            return this.streamsService.getChartSettings(storageKey) ?? filter;
          } else {
            return filter;
          }
        }),
        takeUntil(this.destroy$)
      );
    this.globalSettings$ = this.globalFiltersService.getFilters();
    this.loadingDataState$ = this.deltixChartFeedService.onLoading();

    this.filterForm = this.fb.group({
      width: [],
      chart_type: null,
      period: null,
      source: null,
      symbol: null
    });

    this.currentTab$
      .pipe(
        filter(tab => tab && !!tab.stream && !!tab.symbol), 
        distinctUntilChanged((t1, t2) => t1?.id && t2?.id && t1.id === t2.id), 
        takeUntil(this.destroy$)
      )
      .subscribe(({ stream, symbol }) => {
        this.chartTypeChanged = false;
        this.streamId = stream;
        const tabSybols = symbol.split(',');
        this.symbolName = tabSybols[0];
      }) 

    this.track$ = this.chartTrackService.onTrack();
    
    this.showLevels$ = this.filterState$.pipe(
      map((filter) => filter?.chart_type === ChartTypes.PRICE_LEVELS && filter.source?.[0] === 'L2')
    );
    
    const props$ = this.currentTab$.pipe(
      filter(tab => tab && !!tab.stream && !!tab.symbol && !!tab?.filter.chart_type),
      switchMap(({symbol, stream, id, tbId}) => {
        this.streamId = stream;
        const tabSybols = symbol.split(',');
        this.symbolName = tabSybols[0];

        const savedSymbols = this.chartService.getSavedSymbolList(id);
        if (!savedSymbols) {
          this.chartService.updateSavedSymbolList(id, tabSybols);
        } else {
          this.filterForm?.patchValue( { symbol: savedSymbols.map(symbol => ({ id: symbol, name: symbol })) } );
        }

        return this.symbolsService.getProps(stream, tabSybols[0], null, true, tbId);
      }),
      takeUntil(this.destroy$),
      filter(({props}) => {
        this.chartScrollService.setSymbolRange(`${this.streamId}-${this.symbolName}`, props.symbolRange);
        return !!props.periodicity;
        }),
      publishReplay(1),
      refCount()
    );

    this.currentTab$.pipe(
      filter(tab => tab && !!tab.stream && !!tab.symbol),
      distinctUntilChanged((t1, t2) => t1 && t2 && t1.id === t2.id),
      switchMap(tab => {
        if (!this.tabSymbolList[tab.id]) {
          return this.symbolsService.getSymbols(tab.stream, null, null, tab.tbId)
            .pipe(map(symbols => ({ tab, symbols: symbols.map((s) => ({ id: s, name: s })) })))
        } else {
          return of(this.tabSymbolList[tab.id]).pipe(map(symbols => ({ tab, symbols })))
        } 
      }),
      tap(( { tab, symbols } ) => this.tabSymbolList[tab.id] = symbols),
      switchMap(( { tab }: { tab: TabModel }) => {
        if (this.chartService.streamTabs[tab.stream]) {
          this.chartService.streamTabs[tab.stream].push(tab.id);
        } else {
          this.chartService.streamTabs[tab.stream] = [tab.id];
        }
        const sourceValue = this.filterForm.get('source').value?.[0];
        const tabFilterource = tab.filter.source?.[0];
        if (sourceValue && tabFilterource && sourceValue !== tabFilterource) {
          this.filterForm.patchValue({source: tab.filter.source}, {emitEvent: false, onlySelf: true});
        }
        const { symbol, stream, id, tbId } = tab;
        const tabSybols = symbol.split(',');
        return this.symbolsService.getProps(stream, this.tabSymbolList[id][0].id ?? tabSybols[0], null, true, tbId)
      }),
      filter(({ props }) => props.periodicity?.milliseconds !== this.periodicityInMilliseconds),
      takeUntil(this.destroy$)
      )
      .subscribe(({ props }) => this.periodicityInMilliseconds = this.chartService.updatedPeriodicity[props.streamKey]?.aggregation ??
        props.periodicity?.milliseconds);

    this.currentTab$.pipe(
      filter(tab => tab && !!tab.stream && !this.loadedSources.has(tab.stream)),
      distinctUntilChanged((t1, t2) => t1.stream === t2.stream),
      switchMap(({stream, id}) => {
        this.tabId = id;
        return this.streamSourceService.getAvailableSources([stream]).pipe(
          map(sources => ( { sources, stream } ))
        );
      }),
      takeUntil(this.destroy$)
      )
      .subscribe(( { sources, stream }: { sources: string[], stream: string } ) => {
        this.sourceOptions[stream] = sources;
        this.loadedSources.add(stream);
        this.filterForm.patchValue({
          source: (!this.sourceOptions[stream].length || this.sourceOptions[stream].includes('L2')) ? 
            ['L2'] : [ this.sourceOptions[stream][0] ]
        });
    })

    combineLatest([this.currentTab$, this.symbolList$])
      .pipe(
        distinctUntilChanged(([t1, l1], [t2, l2]) => JSON.stringify([t1, l1]) === JSON.stringify([t2, l2])),
        filter(([tab,]) => tab && !!this.tabId && !!tab.stream && tab.chart),
        switchMap(([tab, list]) => this.symbolsService.getRanges(tab.stream, list, tab.tbId)),
        takeUntil(this.destroy$)
      )
      .subscribe((range: { start: string, end: string }) => this.scrollRange = { ...range, tabId: this.tabId });
    
    this.filterForm.get('symbol').valueChanges
      .pipe(
        takeUntil(this.destroy$),
        map(symbolList => symbolList.map((symbolItem: MultiSelectItem) => symbolItem.id)),
        filter(symbolList => !!symbolList.length),
        distinctUntilChanged((list1, list2) => JSON.stringify(list1) === JSON.stringify(list2)),
        switchMap(selectedSymbols => this.currentTab$.pipe(
          filter(tab => !!tab.id), 
          take(1), 
          map(tab => ({ selectedSymbols, tab })),
          takeUntil(this.destroy$),
        )
      ))
      .subscribe(({ selectedSymbols, tab }) => {
        this.symbolsTooltipText = 'Symbols: ' + selectedSymbols.join(', ');
        this.setSelectedSymbols.emit(selectedSymbols);
        this.chartService.updateSavedSymbolList(tab.id, selectedSymbols);
        this.updateTab();
      });

    this.periodicity$ = combineLatest([
      props$.pipe(pluck('props')),
      this.shortSelectedRange$,
      this.currentTab$.pipe(
        filter(tab => !!tab?.chartType), 
        distinctUntilChanged((t1, t2) => JSON.stringify(t1.chartType) === JSON.stringify(t2.chartType)))
    ]).pipe(
      map(([props, shortRange, tab]) => {
        if (props.periodicity.type === PeriodicityType.irregular 
          && tab.chartType.includes(ChartTypes.PRICE_LEVELS) && this.chartTypeChanged) {
          const barSizeControl = this.filterForm.get('period');
          if (shortRange && barSizeControl.value?.aggregation > 1000) {
            barSizeControl.patchValue({ name: '1 second', aggregation: 1000 });
            this.onBarsPeriodSubmit();
          } else if (!shortRange && barSizeControl.value?.aggregation === 1000) {
            barSizeControl.patchValue({ name: '1 minute', aggregation: 60000 });
            this.onBarsPeriodSubmit();
          }
        }
        return this.chartService.updatedPeriodicity[props.streamKey]?.aggregation ?? 
          (Number(props.periodicity.milliseconds) || (shortRange ? 1000 : 60 * 1000));
      })
    );
    
    this.minInterval$ = props$
      .pipe(
        map(({props}) => this.chartService.updatedPeriodicity[props.streamKey]?.aggregation ?? 
          (Number(props.periodicity.milliseconds) || 1000)),
        publishReplay(1),
        refCount()
      );

    this.minInterval$.pipe(takeUntil(this.destroy$)).subscribe(min => this.minInterval = min);
    
    this.maxInterval$ = this.currentTab$.pipe(
      filter(tab => tab && !!tab.stream && !!tab.symbol),
      take(1),
      switchMap(({symbol, stream, tbId}) =>
        this.streamsService.rangeCached(stream, symbol.split(',')[0], this.space, null, tbId),
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
      publishReplay(1),
      refCount()
    );
    
    this.showBarsChart$ = combineLatest([
      this.filterState$.pipe(
        filter(filter => !!filter.chart_type),
        distinctUntilChanged((f1, f2) => f1.chart_type === f2.chart_type)),
      this.minInterval$.pipe(distinctUntilChanged(equal)),
      this.maxInterval$,
    ]).pipe(
      map(([filter, minInterval, maxInterval]) => {
        return minInterval && maxInterval && barChartTypes.includes(filter?.chart_type);
      }),
    );
    
    const zoomLimits$ = combineLatest([
      this.showBarsChart$,
      this.filterForm.get('period').valueChanges.pipe(startWith(null)),
    ]).pipe(
      map(([isBarChart]) => {
        const period = this.filterForm.get('period').value;
        if (!isBarChart || !period) {
          return null;
        }
        
        return zoomLimits(period.aggregation);
      }),
    );
    
    this.widthValuesMs$ = zoomLimits$.pipe(
      map((limits) => {
        if (this.periodicityInMilliseconds) {
          const timeRangeList = defaultTimeRangeList(this.periodicityInMilliseconds);
          const rangeValues = WIDTH_VALUES_MS.filter(value => value.val === 'custom' || timeRangeList.includes(value.val as number));
          this.maxDefaultRangeValue = rangeValues[rangeValues.length - 1].val as number;
          return rangeValues;
        }

        if (!limits) {
          const rangeValues = WIDTH_VALUES_MS.filter(value => value.defaultList);
          this.maxDefaultRangeValue = rangeValues[rangeValues.length - 1].val as number;
          return rangeValues;
        }

        const rangeValues = WIDTH_VALUES_MS.filter(value => {
          return value.defaultList && (value.val === 'custom' || 
            (+value.val >= limits[0] && (+value.val <= limits[1] || limits[1] === null)));
        });
        this.maxDefaultRangeValue = rangeValues[rangeValues.length - 1].val as number;
        return rangeValues;
      }),
    );
    

    this.globalSettings$.pipe(takeUntil(this.destroy$)).subscribe((filters) => {
      const filter_date_format = filters.dateFormat[0];
      const filter_time_format = filters.timeFormat[0].replace(/f{9}/, 'fff').replace(/f{6}/, 'fff');
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

    this.filterState$
      .pipe(
        filter(filter => !!filter),
        distinctUntilChanged((f1, f2) => {
          this.customRangeFromValue = new Date(f2.from);
          this.customRangeToValue = new Date(f2.to);
          return +new Date(f1.from) <= +new Date(f2.from) && +new Date(f1.to) >= +new Date(f2.to);
        }),
        takeUntil(this.destroy$)
      ).subscribe();
    
    this.currentTab$
      .pipe(
        filter((TAB) => TAB?.isView || Boolean(TAB?.streamRange && TAB?.chartType?.length)),
        filter((TAB) => TAB?.isView || Boolean(TAB.filter && TAB.filter?.from && TAB.filter?.to)),
        withLatestFrom(this.globalFiltersService.getFilters()),
        takeUntil(this.destroy$),
      )
      .subscribe(([TAB]) => {
        this.streamId = TAB.stream;
        this.deltixChartFeedService.updateRange(+new Date(TAB.filter.from), +new Date(TAB.filter.to));
        this.streamId = TAB.stream;
        const tabFilter = TAB.filter;
        if (!tabFilter.silent) {
          this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
        }
        let formIsChanged = false;
        const CHART_TYPE_CONTROL = this.filterForm.get('chart_type'),
          CHART_TYPE_CONTROL_VALUE = CHART_TYPE_CONTROL.value;
        if (
          !tabFilter.chart_type ||
          (tabFilter.chart_type !== this.getChartId(CHART_TYPE_CONTROL_VALUE?.[0]) && this.currentChartTab !== TAB.id) ||
          !TAB.chartType.includes(this.getChartId(CHART_TYPE_CONTROL_VALUE?.[0]) as ChartTypes)
        ) {
          CHART_TYPE_CONTROL.setValue(
            TAB.chartType.includes(tabFilter.chart_type) ? 
              [ this.getChartTitle(tabFilter.chart_type) ] : [ this.getChartTitle(TAB.chartType[0]) ],
          );
          this.isFirstBarSubmit = barChartTypes.includes(TAB.chartType[0]) && !tabFilter.period;
          formIsChanged = true;
        }

        if (TAB.exchange && TAB.exchange !== this.exchangeControl.value && this.exchangeControl.pristine) {
          this.exchangeControl.patchValue(TAB.exchange);
          const exchangeStorage = this.tabStorage.flow<{ track: boolean; exchange: { id: string; name: string } }>('exchange');
          exchangeStorage.updateDataSync((data) => ({...data, exchange: { id: TAB.exchange, name: TAB.exchange } }));
        }

        const streamPeriodAggregation = tabFilter.period?.aggregation;
        if (streamPeriodAggregation && streamPeriodAggregation !== this.filterForm.get('period').value?.aggregation) {
          this.filterForm.patchValue( { period: tabFilter.period } ); 
        }

        if (TAB.rangeStart && TAB.rangeEnd && !this.currentRange) {
          this.onFilterSubmit([new Date(TAB.rangeStart).getTime(), new Date(TAB.rangeEnd).getTime()]);
          this.currentRange = [TAB.rangeStart, TAB.rangeEnd];
          this.chartService.scrollEnabled = false;
          setTimeout(() => {
            this.chartService.scrollEnabled = true;
            this.currentRange.length = 0;
          }, 2000);
        }

        if (this.currentRange?.length) {
          [tabFilter.from, tabFilter.to] = this.currentRange;
        }

        if (!this.chartService.chartFilterFormTouched.has(TAB.id) && !this.streamsService.chartDraggedOrZoomed) {
          const tabIndex = this.storageService.getTabs().findIndex(tab => tab.id === this.tabId);
          const storageKey = `${this.streamId}_${tabIndex}`;
          const savedChartSettings = this.streamsService.getChartSettings(storageKey);
          const savedTabChartSettings = this.streamsService.getChartTabSettings(TAB.id);

          if (savedChartSettings) {
            this.applySavedSettings(tabFilter, savedChartSettings);
          }

/*           if (savedTabChartSettings) {
            this.applySavedSettings(tabFilter, savedTabChartSettings);
          } */

          if (tabFilter.source && !this.chartService.chartFilterFormTouched.has(TAB.id)) {
            this.filterForm.patchValue({source: tabFilter.source});
          }

          const defaultTimeRangeSet = JSON.parse(sessionStorage.getItem('defaultRangeTabs')) ?? [];
          if (!this.currentRange && !defaultTimeRangeSet.includes(TAB.id)) {
            const noSavedSettings = !savedChartSettings && !savedTabChartSettings;
            if (this.periodicityInMilliseconds && this.scrollRange?.tabId === TAB.id && noSavedSettings) {
              const defaultTimeRange = defaultTimeRangeList(this.periodicityInMilliseconds)[0];
              tabFilter.from = new Date(+new Date(this.scrollRange.end) - defaultTimeRange).toISOString();
              tabFilter.to = this.scrollRange.end;
              this.filterForm.get('width').setValue(defaultTimeRange);
              sessionStorage.setItem('defaultRangeTabs', JSON.stringify([...defaultTimeRangeSet, TAB.id]));
            } else {
              const defaultTimeRange = defaultTimeRangeList()[1];
              this.filterForm.get('width').setValue(defaultTimeRange);
            }
          }
            
          if (formIsChanged && !tabFilter.silent) {
            this.onFilterSubmit(
              tabFilter.from && tabFilter.to
                ? [new Date(tabFilter.from).getTime(), new Date(tabFilter.to).getTime()]
                : null,
            );
          }
        }
        this.tabId = TAB.id;
        this.currentChartTab = TAB.id;
        this.setModalRangesFromUtc(tabFilter.from, tabFilter.to);

        if (CHART_TYPE_CONTROL.value?.[0] === ChartTypes.PRICE_LEVELS) {
          if (this.levels !== tabFilter['levels'] || typeof this.levels === 'undefined') {
            this.levels = tabFilter['levels'] || this.levels || this.lvlValues[2];
            formIsChanged = true;
          }
        } else {
          this.levels = null;
        }

        if (this.lastOpenedTab?.id && TAB.id !== this.lastOpenedTab?.id) {
          this.streamsService.removeChartSettings();
/*           this.chartService.chartFilterFormTouched.delete(this.lastOpenedTab.id); */
          this.streamsService.updateChartTabSettings(this.lastOpenedTab.id, this.lastFilterState);
        }

        const sameTab = this.lastOpenedTab?.id === TAB.id;
        if (!barChartTypes.includes(this.lastFilterState?.chart_type) && barChartTypes.includes(tabFilter.chart_type) && sameTab) {
          this.chartTypeChanged = true;
          setTimeout(() => this.chartTypeChanged = false, 2000);
        }
  
        this.lastOpenedTab = TAB;
        this.lastFilterState = tabFilter;
        this.updateShareUrl(TAB);
        this.chartScrollService.selectedTimeRange.next({
          from: tabFilter.from,
          to: tabFilter.to
        })
        this.filterRange = [tabFilter.from, tabFilter.to];
        this.shortSelectedRange$.next(+new Date(tabFilter.to) - +new Date(tabFilter.from) <= 90 * 1000)
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
        filter(([chartType, filters]) => barChartTypes.includes(chartType) && !!filters.period),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.checkBarLimits();
      });

    this.chartScrollService.chartRangeStartUpdated
      .pipe(
        filter(change => !!change[`${this.streamId}-${this.symbolName}`]),
        skip(1),
        takeUntil(this.destroy$)
      )
      .subscribe(newRange => this.setTimeRange(newRange[`${this.streamId}-${this.symbolName}`]));
  }
  
  ngOnDestroy(): void {
    this.saveChartSettings();
    this.streamsService.chartDraggedOrZoomed = false;
    this.destroy$.next(true);
    this.destroy$.complete();
    this.streamsService.updateChartTabSettings(this.lastOpenedTab?.id, this.lastFilterState);
  }

  private saveChartSettings() {
    const tabIndex = this.storageService.getTabs().findIndex(tab => tab.id === this.tabId);
    const storageKey = `${this.streamId}_${tabIndex}`;
    this.streamsService.updateChartSettings(storageKey, this.lastFilterState);
  }
  
  public onTimeRangeChange() {
    this.chartService.chartFilterFormTouched.add(this.tabId);
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
    
    this.modalRef?.hide();
  }

  private setTimeRange(newRangeStart: number) {
    this.chartService.chartFilterFormTouched.add(this.tabId);
    const rangeSize = +this.rangeToValue - +this.rangeFromValue;
    const newRangeEnd = newRangeStart + rangeSize;
    this.chartTrackService.track(false);
    this.onFilterSubmit([newRangeStart, newRangeEnd]);
  }
  
  onChartTypeChange(event) {
    this.chartService.chartFilterFormTouched.add(this.tabId);
    combineLatest([
      this.currentTab$.pipe(
        filter(tab => !!tab && !!tab.filter?.from && !!tab.filter?.to), take(1)),
      this.deltixChartFeedService.currentScrollEnd$.pipe(
        filter(end => !!end.value && !end.liveData), 
        distinctUntilChanged((end1, end2) => end1.value === end2.value)
      )]
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(([ tab, end ]) => {
        const streamEndISO = new Date(end.value).toISOString();
        if (tab.filter.to.slice(1, 22) === this.scrollRange.end.slice(1, 22) && 
          tab.filter.to.slice(1, 22) !== streamEndISO.slice(1, 22)) {

          this.filtersManuallyChanged();
          const rangeLength = +new Date(tab.filter.to) - +new Date(tab.filter.from);
          const updatedStart = end.value - rangeLength;
          this.currentRange = [new Date(updatedStart).toISOString(), streamEndISO];
          setTimeout(() => this.currentRange.length = 0, 2000);

          this.onFilterSubmit([updatedStart, end.value]);
          this.filtersManuallyChanged();
        }
      });

    this.filtersManuallyChanged();

    const timeRange = this.filterRange.map(time => +new Date(time));
      
    if (!this.getChartId(event).includes('BARS')) {
      const currentRangeLength = timeRange[1] - timeRange[0];
      if (currentRangeLength <= this.maxDefaultRangeValue) {
        this.onFilterSubmit(timeRange);
      } else {
        const streamEnd = +new Date(this.scrollRange.end) + 10;
        const newRangeEnd = streamEnd < timeRange[1] ? streamEnd : timeRange[1];
        const newRangeStart = newRangeEnd - this.maxDefaultRangeValue;
        this.onFilterSubmit([newRangeStart, newRangeEnd]);
      }
    } else {
      this.onFilterSubmit(timeRange);
    }
    this.filtersManuallyChanged();
  }

  onSourceChange() {
    this.chartService.chartFilterFormTouched.add(this.tabId);
    this.onFilterSubmit();
    this.filtersManuallyChanged();
  }
  
  public onFilterSubmit(startEndDate?: number[], silent?: boolean) {
    const FILTER: { [key: string]: any } = this.filterForm.value;
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
            this.rangeFromValue = startDate;
            this.rangeToValue = endDate;
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

        if (this.filterForm.get('source').value) {
          FILTER.source = this.filterForm.get('source').value;
        }

        if (this.filterForm.get('period').value) {
          FILTER.period = this.filterForm.get('period').value;
        }

        if (this.filterForm.get('chart_type').value?.[0]) {
          FILTER.chart_type = this.getChartId(this.filterForm.get('chart_type').value[0]);
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
    this.chartService.chartFilterFormTouched.add(this.tabId);
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
    if (+this.levelInput > 100 || +this.levelInput <= 0) {
      return;
    }
    this.onLevelsManuallyChanged();
    this.levelsChange$.next(this.levelInput);
    
    this.levelsAutocomplete?.closeDropDown();
    if (validate && Number(this.levelInput) !== this.levels) {
      this.levelsAutocomplete.selectedText = this.levels?.toString();
    }
  }

  private getChartId(chartTitle: string) { 
    return this.chartTypes.find(type => type.title.toUpperCase() === chartTitle)?.id;
  }

  private getChartTitle(chartId: string) {
    return this.chartTypes.find(type => type.id === chartId).title.toUpperCase();
  }
  
  onLevelsManuallyChanged() {
    this.chartService.chartFilterFormTouched.add(this.tabId);
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
  
  public onRangeChange(date: Date, startOrEnd: 'start' | 'end') {
    if (date instanceof Date && !isNaN(date.getTime())) {
      if (startOrEnd === 'end') {
        this.rangeToValue = date;
      } else {
        this.rangeFromValue = date;
      }
      this.bsInlineRangeValue = [this.rangeFromValue, this.rangeToValue];
      this.validateTimeRange();
      this.timeValueError[startOrEnd] = false;
    } else {
      this.timeValueError[startOrEnd] = true;
    }
  }

  setDateIsValid(isValid: boolean, startOrEnd: 'start' | 'end') {
    this.timeValueError[startOrEnd] = !isValid;
  }
  
  public onRangeChangeEvent(dates: Date[]) {
    [this.customRangeFromValue, this.customRangeToValue] = dates;
    this.rangeFromValue = dates[0];
    this.rangeToValue = dates[1];
    this.timeValueError = { start: false, end: false };
    this.validateTimeRange();
  }
  
  onBarsPeriodSubmit(manually = false) {
    if (manually) {
      this.chartService.chartFilterFormTouched.add(this.tabId);
    }
    this.filtersManuallyChanged();
    this.checkBarLimits(manually);
  }
  
  toggleTrack() {
    this.chartTrackService.track(!this.chartTrackService.value());
    this.chartService.chartFilterFormTouched.add(this.tabId);
  }
  
  setConfig() {
    const RANGE: Date[] = [null, null];
    RANGE[0] = this.rangeFromValue = new Date(this.rangeFromValue);
    RANGE[1] = this.rangeToValue = new Date(this.rangeToValue);
    this.bsInlineRangeValue = RANGE;
  }
  
  private checkBarLimits(checkNoData = false) {
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
        if (checkNoData && !zoomTo && !this.isFirstBarSubmit && new Date(from).getTime() > streamRange.end) {
          startEndDate = [streamRange.end - currentWidth / 2, streamRange.end + currentWidth / 2];
        }
        
        this.onFilterSubmit(startEndDate);
        
        this.isFirstBarSubmit = false;
      });
  }
  
  private tabWithRange(): Observable<{
    streamRange: { start: number; end: number };
    filter: FilterModel;
    previousStreamRange: { start: number; end: number };
  }> {
    return this.currentTab$.pipe(
      filter(tab => !!tab),
      switchMap((tab) =>
        this.streamsService
          .rangeCached(
            tab.stream,
            tab.symbol?.split(',')[0],
            tab.space,
            this.filterForm.get('period').value?.aggregation,
            tab.tbId,
          )
          .pipe(
            take(1),
            filter(range => !!range),
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
    const chosenRange = (this.rangeToValue?.getTime() || 0) - (this.rangeFromValue?.getTime() || 0);
    if (!barChartTypes.includes(filter.chart_type) || !filter.period?.aggregation) {
      this.timeRangeError = chosenRange < 1000;
      this.timeRangeLimits = {from: timestampToDay(1000), to: null};
      this.cdRef.detectChanges();
      return;
    }
    
    const [limitFrom, limitTo] = zoomLimits(filter.period.aggregation);
    this.timeRangeError = chosenRange < limitFrom || (chosenRange > limitTo && limitTo !== null);
    this.timeRangeLimits = {from: timestampToDay(limitFrom), to: timestampToDay(limitTo)};
    this.cdRef.detectChanges();
  }
  
  private filtersManuallyChanged() {
    this.chartTrackService.track(false);
  }
  
  private addLocalTimezone(date: Date): Date {
    if (date instanceof Date && !isNaN(+date)) {
      const offset = getTimeZoneOffset(this.filter_timezone?.name);
      return new Date(toUtc(date.toISOString()).getEpochMillis() + offset * 60 * 1000);
    } else {
      return null;
    }
  }
  
  private showRangePicker() {
    if (this.modalRef) {
      return;
    }
    
    this.tabWithRange()
      .pipe(take(1))
      .subscribe(({filter}) => {
        this.modalRef = this.modalService.show(this.customRangePicker);
        this.modalRef.onHide.pipe(take(1), takeUntil(this.destroy$))
          .subscribe(() => {
            this.modalRef = null;
            this.timeValueError = {
              start: false,
              end: false
            }
          });

        this.rangeFromValue = new Date(filter.from);
        this.rangeToValue = new Date(filter.to);

        this.customRangeFromValue = new Date(filter.from);
        this.customRangeToValue = new Date(filter.to);
        this.bsInlineRangeValue = [this.customRangeFromValue, this.customRangeToValue];
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
  
  private subscribeExchanges() {

    this.exchanges$ = this.symbolList$.pipe(
      switchMap(() => {
        return this.deltixChartFeedService.symbolExchangesSubject;
      }),
      map(exchanges => {
        this.exchanges = exchanges;
        const options = new Set<string>();
        this.symbolList.forEach(symbol => {
          if (this.exchanges[symbol]) {
            [ ...this.exchanges[symbol] ].forEach(e => options.add(e))
          }
        })
        return [ ...options ].map(exchange => ({
          id: exchange, 
          name: exchange,
          disabled: !this.symbolList
            .every(symbol => this.deltixChartFeedService.symbolExchanges[symbol]?.has(exchange))
        }))
      }),
      map(exchanges => [...exchanges.filter(e => !e.disabled), ...exchanges.filter(e => e.disabled) ]),
      publishReplay(1),
      refCount()
    );
    const exchangeStorage = this.tabStorage.flow<{ track: boolean; exchange: { id: string; name: string } }>('exchange');
    
    this.exchanges$
      .pipe(
        switchMap((exchanges) =>
          this.exchangeControl.valueChanges.pipe(map((value) => ({value, exchanges}))),
        ),
        distinctUntilChanged(equal),
        takeUntil(this.destroy$),
      )
      .subscribe(({value, exchanges}) => {
        const exchange = exchanges.find((e) => e.id === value);
        if (exchange) {
          exchangeStorage.updateDataSync((data) => ({
            ...data,
            exchange: exchanges.find((e) => e.id === value),
          }));
        }
      });

    this.exchanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(exchangesList => {
        const selectedExchangeInTheList = exchangesList.find(ex => ex.id === this.exchangeControl.value);
        if (!selectedExchangeInTheList && exchangesList.length) {
          this.exchangeControl.patchValue(exchangesList[0].id, {emitEvent: false});
        }
      });
    
    this.exchangeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.chartExchangeService.manuallyChanged());
    
    exchangeStorage
      .getData()
      .pipe(
        filter((data) => !!data?.exchange),
        distinctUntilChanged(equal),
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        this.exchangeControl.patchValue(data.exchange.id, {emitEvent: false});
      });
    
    this.exchanges$
      .pipe(
        filter((exchanges) => !!exchanges.length),
        switchMap((exchanges) =>
          exchangeStorage.getDataSync(['exchange']).pipe(map((storage) => ({storage, exchanges}))),
        ),
        take(1),
      )
      .subscribe(({storage, exchanges}) => {
        if (!storage?.exchange?.id) {
          exchangeStorage.updateDataSync((data) => ({...data, exchange: exchanges[0]}));
        }
      });
  }

  private applySavedSettings(tabFilter: FilterModel, savedChartSettings: FilterModel) {
      if (savedChartSettings.chart_type) {
        tabFilter.chart_type = savedChartSettings.chart_type;
        this.filterForm.patchValue( { chart_type: [ this.getChartTitle(savedChartSettings.chart_type) ] } );
      }

      if (savedChartSettings.period) {
        if (savedChartSettings.period.aggregation >= this.minInterval) {
          this.filterForm.patchValue( { period: savedChartSettings.period } ); 
        } else {
          const periodValue = this.streamsService.barPeriods?.find(item => item.aggregation === this.minInterval);
          this.filterForm.patchValue( { period: periodValue } ); 
        }
      }

      this.filterForm.get('width').setValue(savedChartSettings.chart_width_val ?? tabFilter.chart_width_val);

      if (savedChartSettings.levels) {
        tabFilter.levels = savedChartSettings.levels;
      }

      if (savedChartSettings.source) {
        tabFilter.source = savedChartSettings.source;
        this.filterForm.patchValue({source: tabFilter.source});
      }

      const savedRangeIsAppliable = +new Date(savedChartSettings.to) - +new Date(savedChartSettings.from) >= 100;

      if (savedRangeIsAppliable) {
        tabFilter.from = savedChartSettings.from;
        tabFilter.to = savedChartSettings.to;
      }
  }

  shareChart() {
    this.shareLinkService.copyUrlByString(this.shareUrl);
  }

  private updateShareUrl(tab: TabModel) {
    const rangeStart = tab.filter.from;
    const rangeEnd = tab.filter.to;
    const newTab = new TabModel({...tab, rangeStart, rangeEnd, 
      symbol: this.filterForm.get('symbol').value?.map(item => item.id).join(','),
      exchange: this.exchangeControl.value});
    this.shareUrl = this.shareLinkService.getShareUrl(newTab);
  }

  private updateTab() {
    this.currentTab$?.pipe(take(1))
      .subscribe(currentTab => {
        const tabPosition = this.storageService.getTabs().findIndex(tab => tab.id === currentTab.id);
        currentTab.symbol = this.selectedSymbols?.map(s => s.id).join(',');
        this.appStore.dispatch(new StreamsTabsActions.UpdateTab([{tab: currentTab, position: tabPosition}]));
    });
  }
}
