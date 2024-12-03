import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  Input,
  SimpleChanges,
  OnChanges,
  ViewChildren,
  QueryList,
  ChangeDetectorRef,
}                            from '@angular/core';


import { IFormattedNumber }                                                                                from '@deltix/hd.components-common/lib/common';
import {
  everChartChangeConfigurationAction,
  EverChartEmbeddableKernel,
  EverChartIntervalType,
  EverChartLineItemDrawType,
  EverChartPadItem,
  everChartScrollToTimeAction,
  EverChartShapeType,
  IEverChartIntervalItem,
  IEverChartPad,
  ZOOM,
}                             from '@deltix/hd.components-everchart';
import {
  IEverChartPadItem,
  IEverChartShapeItem,
}                             from '@deltix/hd.components-everchart/lib/Store/everChartParams';
import { IEverChartDataItem } from '@deltix/hd.components-everchart/lib/Store/everChartState';
import {
  embeddableAppUpdatePositionAction,
  MultiAppFacade,
}                             from '@deltix/hd.components-multi-app';
import {
  select,
  Store,
}                             from '@ngrx/store';
import equal
                              from 'fast-deep-equal';
import {
  ContextMenuComponent,
  ContextMenuService,
}                                                                                                          from '@perfectmemory/ngx-contextmenu';
import { BehaviorSubject, combineLatest, fromEvent, merge, Observable, of, ReplaySubject, Subject, timer } from 'rxjs';
import {
  auditTime,
  catchError,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  map,
  skip,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
}                                                                                                          from 'rxjs/operators';
import { AppState }                                                                                        from '../../../../../core/store';
import { getFormatSeparator }                                                                              from '../../../../../shared/locale.timezone';
import { BarChartPeriod }                                                                                  from '../../../../../shared/models/bar-chart-period';
import { GlobalFilters }                                                                                   from '../../../../../shared/models/global-filters';
import {
  LinearChartService,
  StoredColorsMap,
}                                                                                                          from '../../../../../shared/services/linear-chart.service';
import { GlobalFiltersService }                                                                            from '../../../../../shared/services/global-filters.service';
import { ResizeObserveService }                                                                            from '../../../../../shared/services/resize-observe.service';
import { StreamsService }                                                                                  from '../../../../../shared/services/streams.service';
import { TabStorageService }                                                                               from '../../../../../shared/services/tab-storage.service';
import { formatDateTime }                                                                                  from '../../../../../shared/utils/formatDateTime';
import { appRoute }                                                                                        from '../../../../../shared/utils/routes.names';
import {
  barChartTypes,
  ChartTypes,
}                                                                                                          from '../../../models/chart.model';
import {
  DEFAULT_ZOOM_TABLE,
  DeltixChartFormattedData,
}                                                                                                          from '../../../models/deltix-chart.models';
import { GlobalFilterTimeZone }                                                                            from '../../../models/global.filter.model';
import { TabModel }                                                                                        from '../../../models/tab.model';
import { ChartExchangeService }                                                                            from '../../../services/chart-exchange.service';
import { ChartTrackService }                                                                               from '../../../services/chart-track.service';
import * as StreamsTabsActions
                                                                                                           from '../../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveOrFirstTab,
  getActiveTabFilters,
}                                                                                                          from '../../../store/streams-tabs/streams-tabs.selectors';
import { ChartsHttpService }                                                                               from '../chart-parts/charts.http.service';
import { DeltixChartStorage }                                                                              from '../chart-parts/deltix-chart-storage';
import { DeltixChartFeedService }                                                                          from '../chart-parts/detix-chart-feed.service';
import { EverChartExtension }                                                                              from '../chart-parts/EverChartExtension';
import { zoomRestrictions }                                                                                from './deltix-chart-zoom-limits';
import {
  day,
  month,
  year,
}                                                                                                          from './units-in-ms';
import { TabNavigationService } from 'src/app/shared/services/tab-navigation.service';
import { ChartScrollService } from '../../../services/chart-scroll.service';
import { SymbolsService } from 'src/app/shared/services/symbols.service';
import { ChartService } from 'src/app/shared/services/chart-service';
import { formatHDate } from 'src/app/shared/locale.timezone';
import * as NotificationsActions from 'src/app/core/modules/notifications/store/notifications.actions';

interface MouseMoveEvent {
  time: number;
  y: number;
  points: any;
  yVal: number;
  yTime?: number;
  symbol: string;
  padId: string;
}

@Component({
  selector: 'app-deltix-charts',
  templateUrl: './deltix-charts.component.html',
  styleUrls: ['./deltix-charts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeltixChartsComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() symbolList: string[] = [];

  @ViewChild('chartRef', {read: ElementRef, static: false}) public container: ElementRef;
  @ViewChild(ContextMenuComponent) public contextMenuComponent: ContextMenuComponent;
  @ViewChildren('symbolName') symbolNames: QueryList<ElementRef>;

  currentTab$: Observable<TabModel>;
  globalSettings$: Observable<GlobalFilters>;
  date_format: string;
  time_format: string;
  datetime_separator: string;
  format: string;
  bsFormat: string;
  levels: number;
  tooltipData$: Observable<{
    time: string;
    point: unknown;
    isBars: boolean;
    isL2: boolean;
    isLinear: boolean;
    isBBO: boolean;
    yVal: number;
    borderGreen: boolean;
    borderRed: boolean;
    borderBlue: boolean;
    borderColor: string;
    from: string;
    to: string;
    linearData: {
      name: string;
      value: string;
      isHighlight: boolean;
      highlightColor: string;
    }[]
  }>;
  tooltipPosition$: Observable<{ top: number; left: number; width: number; height: number }>;
  dragging$ = new BehaviorSubject<boolean>(false);
  hideLine$: Observable<boolean>;
  endOfStreamOutOfRange$ = new BehaviorSubject(true);
  showNoData$ = new BehaviorSubject(false);
  viewDataRoute: { route: string[]; params: object };
  chartDate$: Observable<string>;
  httpError$: Observable<HttpErrorResponse>;
  httpErrorText$: Observable<string>;
  noPoints$: Observable<string[]>;
  noPointsSubject$ = new BehaviorSubject<string[]>([]);
  magnetCoordinates$: Observable<{x: number, y: number, yInPx: number}>;
  selectedRange:  { start: string, end: string };
  streamId: string;
  symbolName: string;
  showChartScroll: boolean = true;
  scrollRange: { start: string, end: string, tabId: string, liveData: boolean };
  tabId: string;
  symbolNameWidth: number;
  chartWidth: number;
  upperPadLineList: { [key: string]: string[] } = {};
  symbolList$ = new Subject<string[]>();
  volumeHeaderTop: number;
  symbolChartHeight: number;
  
  private appFacade: MultiAppFacade;
  private destroy$ = new Subject();
  private LEVELS_COUNT = 10;
  private chartDestroy$ = new Subject<void>();
  private resize$ = new Subject<{ width: number; height: number }>();
  private mouseMove$ = new ReplaySubject<MouseMoveEvent>(1);
  private filter_timezone: GlobalFilterTimeZone;
  private hideTooltip$ = new BehaviorSubject(false);
  private retry$ = new Subject();
  private symbolRange: { start: string, end: string };
  private filterRange: { from: number, to: number };
  private marketHours$: Observable<{ startTime: number, endTime: number }[]>;
  closedMarketRanges: { [symbolName: string]: {from: number, to: number }[] } = {};
  marketHoursVisible: boolean = true;

  private lastUsedPrecision: number;
  private precisionCounter = 0;

  @HostListener('click', ['$event']) onClick(event: MouseEvent) {
    if (this.streamsService.streamPropsOpened) {
      const eventCoordinateY = event.clientY;
      const targetSymbol = this.getTargetSymbol(eventCoordinateY);
    }

    this.tabNavigationService
      .focusFirstFocusableElement(this.elementRef.nativeElement.closest('as-split-area'));
  }
  
  @HostListener('contextmenu', ['$event']) onRightClick(event: MouseEvent) {
    const eventCoordinateY = event.clientY;

    const targetSymbol = this.getTargetSymbol(eventCoordinateY);
    
    event.preventDefault();
    event.stopPropagation();
    
    combineLatest([this.currentTab$, this.mouseMove$])
      .pipe(take(1), filter(([,move]) => !!move.yTime))
      .subscribe(([tab, move]) => {
        const route = ['/', appRoute, 'symbol', 'view', tab.stream, targetSymbol ?? tab.symbol.split(',')[0]];
        const params = {
          chartType: tab.chartType,
          newTab: 1,
          isView: tab.isView,
          streamName: tab.streamName,
          space: tab.space,
          'tabFilters:from': new Date(move.yTime)?.toISOString(),
          'tabFilters:manuallyChanged': true,
        };
        this.viewDataRoute = {route, params};
        this.contextMenuService.show.next({
          contextMenu: this.contextMenuComponent,
          event: event,
          item: null,
        });
      });
  }
  
  constructor(
    private appStore: Store<AppState>,
    private everChartFeedService: DeltixChartFeedService,
    private tabStorageService: TabStorageService<DeltixChartStorage>,
    private resizeObserveService: ResizeObserveService,
    private streamsService: StreamsService,
    private symbolService: SymbolsService,
    private elementRef: ElementRef<HTMLElement>,
    private globalSettingService: GlobalFiltersService,
    private chartTrackService: ChartTrackService,
    private contextMenuService: ContextMenuService,
    private chartExchangeService: ChartExchangeService,
    private linearChartsService: LinearChartService,
    private chartsHttpService: ChartsHttpService,
    private tabNavigationService: TabNavigationService,
    private chartScrollService: ChartScrollService,
    private cdRef: ChangeDetectorRef,
    private chartService: ChartService,
    private tabStorage: TabStorageService<{ track: boolean; exchange: { id: string; name: string } }>,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.symbolList.currentValue) {
      this.everChartFeedService.setSymbolList(changes.symbolList.currentValue);
      setTimeout(() => this.symbolList$.next(changes.symbolList.currentValue), 0);
    }
  }
  
  ngOnInit() {
    this.globalSettings$ = this.globalSettingService.getFilters();
    this.currentTab$ = this.appStore.pipe(select(getActiveOrFirstTab));
    this.httpError$ = this.everChartFeedService.onHttpError();
    this.httpErrorText$ = this.httpError$.pipe(map(httpError => httpError.error?.message || httpError.error.error));
    
    const noPoints$ = this.everChartFeedService.onNoPoints();
    noPoints$.pipe(takeUntil(this.destroy$)).subscribe(noPoints => this.noPointsSubject$.next(noPoints));

    this.noPoints$ = this.noPointsSubject$.asObservable();

    this.symbolList$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((l1, l2) => JSON.stringify(l1) === JSON.stringify(l2))
      ).subscribe(() => this.calculateSymbolNameWidth());

    combineLatest([this.currentTab$, this.symbolList$])
      .pipe(
        distinctUntilChanged(([t1, l1], [t2, l2]) => JSON.stringify([t1, l1]) === JSON.stringify([t2, l2])),
        filter(([tab,]) => tab && !!this.tabId && !!tab.stream && tab.chart),
        switchMap(([tab, list]) => {
          const savedSymbolList = this.chartService.getSavedSymbolList(tab.id);
          return this.symbolService.getRanges(tab.stream, savedSymbolList ?? list);
        }),
        distinctUntilChanged((r1, r2) => JSON.stringify(r1) === JSON.stringify(r2)),
        takeUntil(this.destroy$))
      .subscribe((range: { start: string, end: string }) => {
        this.scrollRange = {
           start: range.start, 
           end: range.end, 
           tabId: this.tabId,
           liveData: false };
      });
    
    this.everChartFeedService.currentScrollEnd$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((end1, end2) => end1.value === end2.value)
      )
      .subscribe(endofStream => {
        const endOfStreamISO = new Date(endofStream.value).toISOString();
        if (endOfStreamISO > this.scrollRange?.end) {
          this.scrollRange = {
            ...this.scrollRange, 
            end: endOfStreamISO,
            liveData: endofStream.liveData
          }
        }
      });

    this.globalSettings$.pipe(takeUntil(this.destroy$)).subscribe((filters) => {
      const filter_date_format = filters.dateFormat[0];
      const filter_time_format = filters.timeFormat[0];
      this.filter_timezone = filters.timezone[0];
      this.date_format = filter_date_format;
      this.time_format = filter_time_format;
      this.datetime_separator = getFormatSeparator(this.date_format);
      
      this.format = filter_date_format + ' ' + filter_time_format;
      this.bsFormat = filter_date_format.toUpperCase() + ' ' + filter_time_format;
      this.bsFormat = this.bsFormat.replace('tt', 'A');
      this.bsFormat = this.bsFormat.replace(/f/g, 'S');
    });
    
    this.chartExchangeService
      .onManuallyCHanged()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.retry();
        this.symbolList$.next(this.symbolList);
      });
    
    this.chartDate$ = combineLatest([this.globalSettings$, this.currentTab$]).pipe(
      filter(([settings, tab]) => Boolean(tab?.filter?.from && tab?.filter?.to)),
      map(([settings, tab]) => {
        if (
          new Date(tab.filter.to).getTime() - new Date(tab.filter.from).getTime() >
          1000 * 60 * 60 * 24
        ) {
          return '';
        }
        return formatDateTime(tab.filter.from, settings.dateFormat[0], settings.timezone[0].name);
      }),
    );

    fromEvent(document, 'click')
      .pipe(
        filter(e => ['a', 'i', 'path', 'svg', 'button'].includes((e.target as HTMLElement).tagName.toLowerCase())),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.changeNonTradableHours());

    fromEvent(window, 'resize')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.changeNonTradableHours());
    
    this.resize$
      .pipe(debounceTime(350), distinctUntilChanged(equal), takeUntil(this.destroy$))
      .subscribe(({width, height}) => {
        this.everChartFeedService.setWidth(width);
        this.onContainerResize(width, height);
      });
    
    this.tooltipData$ = combineLatest([
      this.mouseMove$.pipe(
        distinctUntilChanged(
          (p: { time: number; points: any; yVal: number }, c) =>
            `${p.time}-${p.yVal}` === `${c.time}-${c.yVal}`,
        ),
      ),
      this.currentTab$,
      this.hideTooltip$,
    ]).pipe(
      auditTime(75),
      switchMap(([moveEvent, tab, hideTooltip]) => {
        const storageAndColors$: Observable<[{ colors: StoredColorsMap, showLines: string[] }, Partial<DeltixChartStorage> | null]> = moveEvent.points && tab?.filter.chart_type === ChartTypes.LINEAR ?
          combineLatest([this.linearChartsService.showLinesAndColors(), this.everChartFeedService.storage$.pipe(filter(s => !!s?.data))]) :
          of([{colors: {}, showLines: []}, null]);
        
        return storageAndColors$.pipe(
          map(([linesAndColors, storage]) => [moveEvent, tab, hideTooltip, linesAndColors, storage]),
        );
      }),
      
      map(([moveEvent, tab, hideTooltip, linesAndColors, storage]: [MouseMoveEvent, TabModel, boolean, { colors: StoredColorsMap, showLines: string[] }, Partial<DeltixChartStorage> | null]) => {
        if (!moveEvent.time || hideTooltip || moveEvent.time < this.filterRange?.from || moveEvent.time > this.filterRange?.to) {
          return null;
        }
        
        const symbol = moveEvent.symbol;
        const point = JSON.parse(JSON.stringify(moveEvent.points));
        const isBars = barChartTypes.includes(tab?.filter.chart_type);
        const isBBO = tab?.filter.chart_type === ChartTypes.TRADES_BBO;
        const isLinear = tab.filter.chart_type === ChartTypes.LINEAR;

        const symbolKeyBARS = this.pointKey(symbol, 'BARS');
        const symbolKeyBBO = this.pointKey(symbol, 'BBO');
        const symbolKeyTRADES = this.pointKey(symbol, 'TRADES');
        
        if (this.pointIsTrade(point, moveEvent.yVal, symbolKeyBBO, symbolKeyTRADES)) {
          delete point[symbolKeyBBO];
        } else {
          delete point[symbolKeyTRADES];
        }
        
        const borderGreen =
          (point[symbolKeyBARS] && point[symbolKeyBARS].open < point[symbolKeyBARS].close) ||
          (point[symbolKeyBBO] && point[symbolKeyBBO].askPrice > point[symbolKeyBBO].bidPrice);
        const borderRed =
          (point[symbolKeyBARS] && point[symbolKeyBARS].open > point[symbolKeyBARS].close) ||
          (point[symbolKeyBBO] && point[symbolKeyBBO].askPrice < point[symbolKeyBBO].bidPrice);
        
        const borderBlue = !borderRed && !borderGreen;
        
        let borderColor = null;
        const colorNames = {};
        Object.keys(linesAndColors.colors).forEach(key => colorNames[this.linearId(key)] = key);
        if (isLinear) {
          const lineName = Object.keys(point).find(key => moveEvent.yVal === point[key].value);
          if (lineName) {
            const colorKey = lineName.split('_')[1];
            borderColor = this.colorToString(linesAndColors.colors[colorNames[colorKey]]);
          }
        }
        
        let from;
        let to;
        
        if (point[symbolKeyBARS]) {
          const aggregation = tab.filter.period.aggregation;
          from = this.formatTooltipBarTime(aggregation, moveEvent.time - tab.filter.period.aggregation);
          to = this.formatTooltipBarTime(aggregation, moveEvent.time);
        }
        
        const values = {};
        
        if (isLinear) {
          const firstKey = Object.keys(point)[0];
          storage.data?.find(p => {
            const isCurrent = p.time === point[firstKey].time;
            Object.keys(p.points).forEach(key => {
              if (p.points[key].value !== undefined) {
                values[key] = p.points[key].value;
              }
            });
            return isCurrent;
          });
        }
  
        const linearData = linesAndColors.showLines.map(line => {
          const lineSymbolKey = `${symbol}_${this.linearId(line)}`;
          let value = values[lineSymbolKey];
      
          if (value === undefined || isNaN(value)) {
            value = '-';
          }
    
          return {
            name: line,
            value,
            isHighlight: moveEvent.yVal === point[lineSymbolKey]?.value,
            highlightColor: this.colorToString(linesAndColors.colors[line]),
          };
        });

        let barDataInvalid = false;
        if (point[symbolKeyBARS]) {
          const fallBar = point[symbolKeyBARS].close <= point[symbolKeyBARS].open;
          if (fallBar) {
            barDataInvalid = point[symbolKeyBARS].high < point[symbolKeyBARS].open || 
              point[symbolKeyBARS].low > point[symbolKeyBARS].close;
          } else {
            barDataInvalid = point[symbolKeyBARS].high < point[symbolKeyBARS].close || 
              point[symbolKeyBARS].low > point[symbolKeyBARS].open;
          }
        }
        const eventTimeAsString = new Date(moveEvent.time).toISOString();
        
        return {
          symbol,
          time: formatHDate(eventTimeAsString, [this.date_format], [this.time_format], [this.filter_timezone]),
          point,
          from,
          to,
          yVal: moveEvent.yVal,
          isBars,
          isL2: tab?.filter.chart_type === ChartTypes.PRICE_LEVELS,
          isLinear,
          linearData,
          isBBO,
          borderGreen,
          borderRed,
          borderBlue,
          borderColor,
          barDataInvalid
        };
      }),
    );

    const exchangeStorage = this.tabStorage.flow<{ track: boolean; exchange: { id: string; name: string } }>('exchange');
    const exchange$ = exchangeStorage
      .getData()
      .pipe(takeUntil(this.destroy$));

    this.marketHours$ = combineLatest([
      exchange$.pipe(distinctUntilChanged((data1, data2) => data1?.exchange === data2?.exchange)),
      this.currentTab$
        .pipe(
          distinctUntilChanged((tab1, tab2) => tab1?.filter.to === tab2?.filter.to && 
            tab1?.filter.from === tab2?.filter.from && tab1?.stream === tab2?.stream)
        )
      ]).pipe(
        debounceTime(500),
        switchMap((([data, tab]) => {
          if (data?.exchange) {
            return this.chartsHttpService.getMarketHours(tab.filter?.from, tab.filter?.to, data.exchange.id);
          } else {
            return of([]);
          }
        })),
        takeUntil(this.destroy$)
      );

    combineLatest([
      this.currentTab$.pipe(map((tab) => ({ aggregation: tab?.filter.period?.aggregation ?? null }))),
      this.marketHours$
    ])
      .pipe(
        debounceTime(500),
        withLatestFrom(this.currentTab$.pipe(map((tab) => ({
          from: tab?.filter ? new Date(tab.filter.from).getTime() : 0,
          to: tab?.filter ? new Date(tab.filter.to).getTime() : 0
        })))),
        takeUntil(this.destroy$),
        distinctUntilChanged((res1, res2) => JSON.stringify(res1) === JSON.stringify(res2))
      )
      .subscribe(([[ { aggregation }, marketHours], { from, to }]) => {
        this.filterRange = { from, to };

        const closedMarketRanges = [];
        const dayInMilliseconds = 86400000;
        const weekInMilliseconds = 7 * dayInMilliseconds;

        const dataIsDayly = aggregation >= dayInMilliseconds;
        const { width } = this.getSize();
        const selectedRangeInDays = Math.ceil((this.filterRange.to - this.filterRange.from) / dayInMilliseconds);    

        if (dataIsDayly && selectedRangeInDays > width * 0.8) {
          const closedMarkedRangesWithValues = Object.entries(this.closedMarketRanges).filter(([, value]) => value.length);
          if (closedMarkedRangesWithValues.length) {
            this.appStore.dispatch(new NotificationsActions.AddWarn({
              dismissible: true,
              closeInterval: 10000,
              message: 'Working days indication will be switched off due to large view range',
              alias: 'Days off indication'
            }))
          }
        } else if (aggregation < weekInMilliseconds) { 
          this.appStore.dispatch(new NotificationsActions.RemoveWarnByAlias('Days off indication'));
          this.closedMarketRanges = {};

          for (let i = 0; i < marketHours.length; i += 1) {
            if (i === 0 && this.filterRange.from < marketHours[i].startTime) {
              this.addRangeToClosedMarketRanges(
                closedMarketRanges,
                { from: this.filterRange.from, to: marketHours[i].startTime },
                dataIsDayly,
                aggregation);
            }
            if (i < marketHours.length - 1) {
              this.addRangeToClosedMarketRanges(
                closedMarketRanges,
                { from: marketHours[i].endTime, to: marketHours[i + 1].startTime },
                dataIsDayly,
                aggregation);
            }
            if (i === marketHours.length - 1 && this.filterRange.to > marketHours[i].endTime) {
              this.addRangeToClosedMarketRanges(
                closedMarketRanges,
                { from: marketHours[i].endTime, to: this.filterRange.to },
                dataIsDayly,
                aggregation);
            }
          }
        }

        this.symbolList.forEach(symbolName => {
          this.closedMarketRanges[symbolName] = closedMarketRanges;
        });
        this.cdRef.markForCheck();
      });
  
    this.magnetCoordinates$ = this.mouseMove$.pipe(map((data => {
      const {width, height} = this.getSize();
      if (!data.time || data.time < this.filterRange?.from || data.time > this.filterRange?.to) {
        return null;
      }
      let yInPx = 0;
      const widthInMs = this.filterRange?.to - this.filterRange?.from;
      const xCoordRatio = data.time <= this.filterRange?.to ? (data.time - this.filterRange.from) / widthInMs : 0.95;
      const x = Math.max(0, Math.round(xCoordRatio * width));
      
      const pads = this.appFacade?.getStateFor('everChart', '1').app.pads;
      const padIds = Object.keys(pads);
      const currentPadIndex = padIds.findIndex(padId => padId === data.padId);

      const padHeight = +(height * 0.966 / padIds.length).toFixed(2);

      const pad = pads[data.padId];
      const decimalsL = pad.max.next.toString().split('.')[1]?.length || 0;
      const multi = Math.pow(10, decimalsL);

      yInPx = this.getYCoordinate(
        data.yVal * multi, 
        padHeight, 
        pad.min.next * multi, 
        pad.max.next * multi,
        padHeight * currentPadIndex
      );
     
      return {
        x,
        y: data.y,
        yInPx,
      };
    })));
    
    this.tooltipPosition$ = combineLatest([
      this.magnetCoordinates$,
      this.tooltipDimensions(),
      this.mouseMove$,
    ]).pipe(
      map(([coordinates, dimensions, data]) => {
        if (!coordinates || !data.time) {
          return null;
        }
  
        const {height} = this.getSize();
        const bottomPadding = 25;
        const mousePadding = 10;
        
        const dimensionHeight =
          typeof dimensions.height === 'function' ? dimensions.height(data) : dimensions.height;
        
        const dimensionWidth =
          typeof dimensions.width === 'function' ? dimensions.width(data) : dimensions.width;

        const xInPx = coordinates.x - mousePadding;
        const left = xInPx - dimensionWidth < 0 ? xInPx + mousePadding * 2 : xInPx - dimensionWidth;

        let top = Math.min(
          Math.max(0, coordinates.y - dimensionHeight - mousePadding),
          height - bottomPadding - dimensionHeight,
        ) + Math.round(height / this.symbolList.length) * this.symbolList.findIndex(s => s === data.symbol);

        const boottomBorder = height + 20 - dimensionHeight;
        if (top > boottomBorder) {
          top = Math.round(boottomBorder);
        }
        
        return {
          top,
          left,
          height: dimensionHeight,
          width: dimensionWidth,
        };
      }),
    );
    
    this.tooltipPosition$.pipe(takeUntil(this.destroy$)).subscribe((position) => {
      if (!position) {
        return;
      }
      
      this.elementRef.nativeElement.style.setProperty('--tooltip-top', `${position.top}px`);
      this.elementRef.nativeElement.style.setProperty('--tooltip-left', `${position.left}px`);
      this.elementRef.nativeElement.style.setProperty('--tooltip-height', `${position.height}px`);
      this.elementRef.nativeElement.style.setProperty('--tooltip-width', `${position.width}px`);
    });
    
    this.hideLine$ = combineLatest([
      this.dragging$.pipe(distinctUntilChanged()),
      this.endOfStreamOutOfRange$,
      this.httpError$,
      this.noPoints$
    ]).pipe(
      map(
        ([dragging, outOfRange, httpError, noPoints]) =>
          dragging || outOfRange || !!httpError || !!noPoints.length,
      ),
    );

    this.dragging$
      .pipe(takeUntil(this.destroy$))
      .subscribe(dragging => {
        if (dragging) {
          this.closedMarketRanges = {};
        }
        this.marketHoursVisible = !dragging
    });
  }

  
  private getYCoordinate = (
    value: number,
    height: number,
    min: number,
    max: number,
    padTop: number
  ) => {
    const yOffset = (height * 0.1) / 2;
  
    const domain = { from: min, to: max };
    const range = { from: height - yOffset, to: yOffset };
    const rise = range.from - range.to;
  
    const run = domain.from - domain.to;
  
    if (rise === 0 && run === 0) {
      return 0;
    }
  
    const slope = rise / (run || 0.1);
  
    const intercept = range.from - slope * domain.from;
  
    return slope * value + (isNaN(intercept) ? 0 : intercept) + padTop;
  };
  
  private formatTooltipBarTime(aggregation: number, time: number) {
    switch (true) {
      case aggregation < day:
        const dateTime = new Date(time).toISOString();
        return formatHDate(dateTime, [this.date_format], [this.time_format], [this.filter_timezone]);
      case aggregation < month:
        return formatDateTime(time, this.date_format, this.filter_timezone.name);
      case aggregation < year:
        const separator = this.date_format.replace(/M|y|d/ig, '')[0];
        const first = this.date_format.indexOf('yyyy') < this.date_format.indexOf('MM') ? 'yyyy' : 'MM';
        const second = first === 'yyyy' ? 'MM' : 'yyyy';
        return formatDateTime(time, `${first}${separator}${second}`, this.filter_timezone.name);
    }
    
    return formatDateTime(time, `yyyy`, this.filter_timezone.name);
  }
  
  private pointIsTrade(point, yVal: number, keyBBO: string, keyTRADES: string) {
    if (!point[keyBBO] && point[keyTRADES]) {
      return true;
    }
    
    if (!point[keyTRADES] && point[keyBBO]) {
      return false;
    }
    
    if (point[keyTRADES] && point[keyBBO]) {
      return yVal === point[keyTRADES].value;
    }
  }
  
  ngAfterViewInit(): void {
    const ELEMENT = this.container.nativeElement;
    
    const chartKernel = new EverChartEmbeddableKernel();
    chartKernel.addExtension(new EverChartExtension(this.everChartFeedService));
    fromEvent(ELEMENT, 'mousedown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        ELEMENT?.classList?.add('isGrabbing');
      });
    
    merge(fromEvent(ELEMENT, 'mouseleave'), fromEvent(ELEMENT, 'mouseup'))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        ELEMENT?.classList?.remove('isGrabbing');
      });
    
    this.appFacade = new MultiAppFacade(
      [chartKernel],
      this.container.nativeElement,
      false,
      {},
      {
        resolveResource: (name: string, path: string) => {
          return path.replace('Assets', 'assets');
        },
      },
    );
    
    this.appFacade
      .getActionStream()
      .pipe(
        withLatestFrom(this.appStore.pipe(select(getActiveTabFilters))),
        takeUntil(this.destroy$),
      )
      .subscribe(([action, activeTabFilters]) => {
        switch (action.type) {
          case '@EC/DATA':
            this.everChartFeedService.zoomIntervalChange(action.payload.interval);
            break;
          case '@INPUT/CHANGE_DRAG':
            this.streamsService.chartDraggedOrZoomed = true;
            if (action.payload.drag) {
              this.chartTrackService.track(false);
            }
            
            this.dragging$.next(action.payload.drag);
            break;
          case '@EC/ZOOM':
            this.streamsService.chartDraggedOrZoomed = true;
            if (this.chartTrackService.value()) {
              this.chartTrackService.track(false);
            }
            break;
          case '@EC/CROSSHAIR':
            const {payload} = action;
            this.mouseMove$.next({
              time: payload.data?.time,
              yTime: payload.crosshair.time,
              y: payload.y,
              points: payload.data?.points,
              yVal: payload.crosshair.value,
              padId: payload.crosshair.pad,
              symbol: payload.crosshair.pad.split('_|_')[0]
            });
            break;
          case '@EC/WINDOW_TIME_BORDERS_CHANGE':
            this.everChartFeedService.bordersChange(
              Math.floor(action.payload.startTime),
              Math.ceil(action.payload.endTime),
            );
            this.appStore.dispatch(
              new StreamsTabsActions.SetFilters({
                filter: {
                  ...(activeTabFilters || {}),
                  from: new Date(action.payload.startTime).toISOString(),
                  to: new Date(action.payload.endTime).toISOString(),
                  chart_width_val: 'range',
                  silent: true,
                },
              }),
            );
            break;
          default:
            break;
        }
      });
    
    this.runChart();
    this.calculateSymbolNameWidth();
  }
  
  onChartMouseLeave() {
    this.hideTooltip();
  }
  
  onChartMouseEnter() {
    this.hideTooltip$.next(false);
  }
  
  retry() {
    this.retry$.next();
    this.runChart();
    this.symbolList$.next(this.symbolList);
  }

  private calculateSymbolNameWidth() {
    if (this.symbolNames?.length) {
      let maxWidth = 0;
      for (let el of this.symbolNames) {
        if (maxWidth < el.nativeElement.offsetWidth) {
          maxWidth = el.nativeElement.offsetWidth;
        }
      }
      this.symbolNameWidth = maxWidth;
      this.cdRef.detectChanges();
    }
  }

  private addRangeToClosedMarketRanges(
    closedMarketRanges: { from: number, to: number }[],
    newRangeItem: { from: number, to: number },
    dataIsDayly: boolean,
    aggregation: number) {
      const { from, to } = newRangeItem;
      if (!dataIsDayly) {
        closedMarketRanges.push({ from, to });
      } else {
        const rangeSize = to - from;
        if (rangeSize >= aggregation) {
          const toAsDate = new Date(to);
          toAsDate.setUTCHours(12, 0);

          const fromAsDate = new Date(from);
          if (fromAsDate.getUTCHours() > 12) {
            fromAsDate.setUTCDate(fromAsDate.getUTCDate() + 1);
          }
          fromAsDate.setUTCHours(12, 0);
          closedMarketRanges.push({ from: +fromAsDate, to: +toAsDate });
        }
      }
    }
  
  ngOnDestroy(): void {
    this.destroyChart();
    this.destroy$.next(true);
    this.destroy$.complete();
    this.everChartFeedService.chartDestroy();
    this.appFacade.destroy();
    this.appFacade = null;
  }
  
  private runChart() {
    combineLatest([this.globalSettings$, this.currentTab$, this.symbolList$])
      .pipe(
        distinctUntilChanged(([settings1, tab1, list1], [settings2, tab2, list2]) => {
          if (tab2) {
            this.selectedRange = { start: tab2.filter.from, end: tab2.filter.to };
            if (this.selectedRange && this.symbolRange) {
              this.showChartScroll = this.isChartScrollVisible();
            }
          }

          const compareTab1 = JSON.parse(JSON.stringify(tab1));
          const compareTab2 = JSON.parse(JSON.stringify(tab2));
          delete compareTab1?.filter.chart_width_val;
          delete compareTab2?.filter.chart_width_val;
          delete compareTab1?.filter.silent;
          delete compareTab2?.filter.silent;
          
          delete compareTab1?.filter.width;
          delete compareTab2?.filter.width;
          
          delete compareTab1?.key;
          delete compareTab2?.key;
          
          delete compareTab1?.symbols;
          delete compareTab2?.symbols;
          
          delete compareTab1?.active;
          delete compareTab2?.active;
          return (
            JSON.stringify([settings1, compareTab1, list1]) === JSON.stringify([settings2, compareTab2, list2])
          );
        }),
        map(([settings, tab]) => tab),
        filter(
          (tab) => !!(tab && tab.filter && tab.filter.from && tab.filter.to && !tab.filter.silent),
        ),
        map((tab: TabModel) => {
          if (tab.filter.chart_type === ChartTypes.PRICE_LEVELS && !tab.filter.levels) {
            return { ...tab, filter: { ...tab.filter, levels: 10 } };
          } else {
            return tab;
          }
        }),
        // filter(({filter}) => !(filter.chart_type === ChartTypes.PRICE_LEVELS && !filter.levels)),
        filter(({filter}) => !(barChartTypes.includes(filter.chart_type) && !filter.period)),
        switchMap((tab: TabModel) => {
          this.everChartFeedService.resetHttpError();
          this.hideTooltip();
          this.tabId = tab.id;
          this.streamId = tab.stream;
          this.symbolName = tab.symbol?.split(',')[0];
          this.symbolRange = this.chartScrollService.getSymbolRange(`${this.streamId}-${this.symbolName}`);
          if (this.selectedRange && this.symbolRange) {
            this.showChartScroll = this.isChartScrollVisible();
          }
          return combineLatest([
            this.streamsService.rangeCached(
              tab.stream,
              this.symbolName,
              tab.space,
              barChartTypes.includes(tab.filter.chart_type) ? tab.filter.period.aggregation : null,
            ),
            this.streamsService.rangeCached(tab.stream, this.symbolName, tab.space),
          ]).pipe(map(([range, pureRange]) => [range, pureRange.end, tab]));
        }),
        debounceTime(300),
        takeUntil(this.destroy$),
        takeUntil(this.retry$),
        switchMap(([range, pureRangeEnd, tab]) => {
          const lines$ = tab.filter.chart_type === ChartTypes.LINEAR ?
            this.chartsHttpService.linesInfo(tab.stream) :
            of([]);
          
          return lines$.pipe(
            switchMap(lines => {
              this.linearChartsService.setLines(lines);
              return this.linearChartsService.linesAndColor().pipe(take(1), withLatestFrom(this.currentTab$));
            }),
            map(([linesAndColors, currentTab]) => [range, pureRangeEnd, currentTab, linesAndColors]),
          );
        }),
        switchMap(([range, pureRangeEnd, currentTab, linesAndColors]) => this.streamsService.getProps(this.streamId)
          .pipe(take(1), map(result => result.props.periodicity?.milliseconds), takeUntil(this.destroy$),
            map(periodicity => [range, pureRangeEnd, currentTab, linesAndColors, periodicity]))
          )
      )
      .subscribe(
        ([{
          end,
          start,
        }, pureRangeEnd, tab, linesAndColors, periodicity]: 
        [{ end: string; start: string }, string, TabModel, { colors: StoredColorsMap, lines: string[] }, number]) => {
          if (!tab?.filter.chart_type) {
            return;
          }
          
          this.endOfStreamOutOfRange$.next(true);
          if (tab.filter.levels) {
            this.LEVELS_COUNT = tab.filter.levels;
          }
          
          if (!this.appFacade) {
            return;
          }

          if (this.selectedRange && this.symbolRange) {
            this.showChartScroll = this.isChartScrollVisible();
          }
          
          this.destroyChart();
          this.setZoomAndIntervals(tab.filter.chart_type, periodicity, tab.filter.period);
          this.everChartFeedService.setWidth(this.getSize().width);
          this.everChartFeedService.chartInit(
            new Date(tab.filter.from).getTime(),
            new Date(tab.filter.to).getTime(),
            tab.filter.period?.aggregation,
            tab.filter.levels,
            tab.filter.chart_type,
            new Date(pureRangeEnd).getTime(),
            new Date(end).getTime(),
            this.tabStorageService,
            tab.filter.source?.[0]
          );
          
          this.initChart(tab, new Date(start).getTime(), linesAndColors.colors, linesAndColors.lines);
        });
  }
  
  private hideTooltip() {
    this.hideTooltip$.next(true);
    timer(100).subscribe(() =>
      this.mouseMove$.next({time: null, y: null, points: null, yVal: null, symbol: '', padId: ''}),
    );
  }
  
  private getSize(): { width: number; height: number } {
    const el = this.container.nativeElement;
    this.chartWidth = el.clientWidth;
    return {width: el.clientWidth, height: el.clientHeight};
  }
  
  private onContainerResize(width: number, height: number) {
    this.appFacade.dispatch(
      embeddableAppUpdatePositionAction('everChart', '1', {
        width: width,
        height: height - 9,
        x: 0,
        y: 0,
      }),
    );
  }
  
  private updatePads(chartType: ChartTypes, colors: StoredColorsMap, showLines: string[]) {
    const pads: IEverChartPad[] = this.getPads(chartType, colors, showLines);
    this.appFacade.dispatchTo(everChartChangeConfigurationAction(pads), 'everChart', '1');
  }
  
  destroyChart() {
    if (this.appFacade?.destroyApp) {
      this.everChartFeedService.chartDestroy();
      this.appFacade.destroyApp('everChart', '1');
      this.chartDestroy$.next();
    }
  }
  
  private initChart(TAB: TabModel, streamRangeStart: number, colors: StoredColorsMap, showLines: string[]) {
    this.hideTooltip();
    const fromTime = new Date(TAB.filter.from).getTime();
    const minTime = Math.min(streamRangeStart, fromTime);
    const chartConfig = {
      pads: this.getPads(TAB.filter.chart_type, colors, showLines),
      maxBucketSize: 1000,
      initialTime: [new Date(TAB.filter.from).getTime(), new Date(TAB.filter.to).getTime()] as [
        number,
        number,
      ],
      minTime,
      animationDuration: 0,
      disableBackButton: true,
      formatFunctions: {
        xCrosshair: (tick) => {
          const dateAsString = new Date(tick).toISOString();
          return formatHDate(dateAsString, [this.date_format], [this.time_format], [this.filter_timezone]);
        },
        xAxis: (tick: number, interval: number): string => {
          if (!tick) {
            return '';
          }
          
          let format = 'ss.fff';
          
          if (interval >= 1000) {
            format = 'HH:mm:ss';
          }
          
          if (interval >= 60 * 1000) {
            format = 'HH:mm';
          }
          
          if (interval >= 60 * 60 * 1000) {
            format = 'dd/MM HH';
          }
          
          if (interval >= 24 * 60 * 60 * 1000) {
            format = 'dd/MM/yyyy';
          }
          
          return formatDateTime(tick, format, this.filter_timezone.name);
        },
        yAxis: (numberToFormat: string, an): IFormattedNumber => {
          const splitted = numberToFormat.split('.');
          const integerPart = splitted[0];
          let fractionalPart = splitted[1] ?? '';

          const unformatNum = numberToFormat.slice(0, -2).endsWith('999') || numberToFormat?.slice(0, -2).endsWith('000') && numberToFormat.length > 10;
          if (unformatNum) {
            let temp = numberToFormat.split('.')[1].slice(0, -2);
            if (temp.endsWith('999')) {
              while (temp.endsWith('9')) {
                temp = temp.slice(0, -1);
              }
              fractionalPart = `${temp.slice(0, -2)}${+`${temp.slice(-2)}9` + 1}`;
            } else {
              while (temp.endsWith('0')) {
                temp = temp.slice(0, -1);
              }
              fractionalPart = temp;
            }
          }

          if (this.precisionCounter === 0) {
            this.lastUsedPrecision = fractionalPart.length > 1 ? fractionalPart.length : 2;
            this.precisionCounter += 1;
          } else if (this.precisionCounter < 4) {
            if (fractionalPart.length >= this.lastUsedPrecision) {
              fractionalPart = fractionalPart.slice(0, this.lastUsedPrecision);
            } else {
              fractionalPart = `${fractionalPart}${new Array(this.lastUsedPrecision - fractionalPart.length).fill('0').join('')}`;
            }
            if (this.precisionCounter === 3) {
              this.precisionCounter = 0;
            } else {
              this.precisionCounter += 1;
            }
          }

          const result = {
            integerPart,
            fractionalPart: fractionalPart.length < 2 ? 
              `${fractionalPart}${new Array(2 - fractionalPart.length).fill('0').join('')}` : fractionalPart,
            decimalSeparator: '.',
          }
          
          return result;
        },
      },
    };
    
    this.everChartFeedService.runChart(TAB.filter.source?.[0]);
    
    const {width, height} = this.getSize();
    
    this.appFacade
      .createApp(
        'everChart',
        '1',
        {
          height: height - 9,
          width,
          x: 0,
          y: 0,
        },
        chartConfig,
      )
      .pipe(
        // @ts-ignore
        catchError((e) => {
          console.log(e);
          return of();
        }),
        takeUntil(this.chartDestroy$),
      )
      .subscribe((value) => {
        if (value === 'initialized') {
          this.streamsService.chartLoaded$.next();
          this.hideTooltip$.next(false);
          this.resize$.next(this.getSize());
          this.resizeObserveService
            .observe(this.container.nativeElement)
            .pipe(takeUntil(this.chartDestroy$))
            .subscribe(() => {
              this.resize$.next(this.getSize());
            });
          
          const borders$ = this.appStore.pipe(
            select(getActiveTabFilters),
            filter((f) => !!f),
            map((filters) => [filters.from, filters.to]),
            distinctUntilChanged(equal),
            map(([from, to]) => [new Date(from).getTime(), new Date(to).getTime()]),
          );
          
          this.linearChartsService.colors().pipe(takeUntil(this.chartDestroy$)).subscribe(colors => {
            this.updatePads(TAB.filter.chart_type, colors, showLines);
          });

          this.linearChartsService.showLines().pipe(takeUntil(this.chartDestroy$), distinctUntilChanged(equal))
            .subscribe(lines => this.updatePads(TAB.filter.chart_type, colors, lines));
          
          combineLatest([borders$, this.everChartFeedService.onEndOfStream()])
            .pipe(
              takeUntil(this.chartDestroy$),
              withLatestFrom(this.chartTrackService.onTrack()),
              switchMap(([data, track]) => timer(track ? 300 : 0).pipe(map(() => data))),
              distinctUntilChanged(equal),
              map(([[from, to], end]) => {
                const length = to - from;
                const noDataLength = to - end;
                return Math.max(0, Math.min((noDataLength / length) * 100, 100));
              }),
              distinctUntilChanged(),
            )
            .subscribe((right) => {
              this.elementRef.nativeElement.style.setProperty('--end-of-stream-right', `${right}%`);
              this.endOfStreamOutOfRange$.next([0, 100].includes(right));
              this.showNoData$.next(right === 100);
            });
          
          this.everChartFeedService
            .onEndOfStream()
            .pipe(
              debounceTime(400),
              takeUntil(this.destroy$),
              tap(() =>
                this.elementRef.nativeElement.style.setProperty('--end-of-stream-opacity', '1'),
              ),
              delay(300),
            )
            .subscribe(() => {
              this.elementRef.nativeElement.style.setProperty('--end-of-stream-opacity', '0.1');
            });
          
          const stopTrack$ = this.chartTrackService.onTrack().pipe(filter((s) => !s));
          const loading$ = this.everChartFeedService.onLoading();
          this.chartTrackService
            .onTrack()
            .pipe(
              filter(Boolean),
              switchMap(() => {
                const first$ = this.everChartFeedService.onEndOfStream().pipe(
                  take(1),
                  map((time) => [time]),
                );
                const next$ = combineLatest([
                  this.everChartFeedService.onEndOfStream().pipe(skip(1)),
                  loading$,
                ]).pipe(
                  filter(([time, loading]) => !loading),
                  takeUntil(stopTrack$),
                );
                return merge(first$, next$);
              }),
              withLatestFrom(this.currentTab$),
              takeUntil(this.chartDestroy$),
            )
            .subscribe(([[time], tab]) => {
              const screenSize =
                new Date(tab.filter.to).getTime() - new Date(tab.filter.from).getTime();
              this.appFacade.dispatchTo(
                everChartScrollToTimeAction(time + screenSize * 0.15),
                'everChart',
                '1',
              );
            });
        }
      });
    if (barChartTypes.includes(TAB.filter.chart_type)) {
      const padHeight = Math.round(100 / this.symbolList.length);
      this.volumeHeaderTop = Math.round(padHeight * (this.symbolList.length < 4 ? 0.75 : 0.65));
    } else {
      this.volumeHeaderTop = null;
    }
  }

  private setZoomAndIntervals(chartType: ChartTypes, periodicity: number, period: BarChartPeriod): void {
    if ([ChartTypes.PRICE_LEVELS, ChartTypes.TRADES_BBO].includes(chartType)) {
      ZOOM.zoom = DEFAULT_ZOOM_TABLE.filter(value => value < 5900);
    } else if (barChartTypes.includes(chartType) || periodicity) {
      ZOOM.zoom = zoomRestrictions(period?.aggregation ?? periodicity);
    } else {
      ZOOM.zoom = DEFAULT_ZOOM_TABLE;
    }
    ZOOM.intervals = Object.keys(ZOOM.zoom).map((key) => parseInt(key, 0));
  }
  
  private tooltipDimensions(): Observable<{ width: number | Function; height: number | Function }> {
    return combineLatest([
      this.currentTab$.pipe(filter(Boolean)),
      this.globalSettingService.getFilters(),
      this.tooltipData$,
    ]).pipe(
      map(([tab, filters, tooltipData]: [TabModel, GlobalFilters, any]) => {
        const isBars = [ChartTypes.BARS, ChartTypes.BARS_BID, ChartTypes.BARS_ASK, ChartTypes.BARS_TRADES].includes(tab.filter.chart_type);
        const date = isBars ? this.formatTooltipBarTime(tab.filter.period?.aggregation, 0) : `${filters.dateFormat[0]} ${filters.timeFormat[0]}`;
        const dateLength = date.length * 7 + 20 + (isBars ? 30 : 0);
        const symbol = tooltipData?.symbol;
        
        switch (tab.filter.chart_type) {
          case ChartTypes.BARS:
          case ChartTypes.BARS_BID:
          case ChartTypes.BARS_ASK:
          case ChartTypes.BARS_TRADES:
            return {
              width: (data) => {
                const barsData = data.points[this.pointKey(symbol, 'BARS')];
                const barValuesLengths = [
                  `High: ${barsData?.high}`,
                  `Low: ${barsData?.low}`,
                  `Open: ${barsData?.open}`,
                  `Close: ${barsData?.close}`,
                  `Volume: ${barsData?.volume}`,
                ].map(val => `${val}`.length * 7.5);
                return Math.max(dateLength, ...barValuesLengths);
              },
              height: 155,
            };
          case ChartTypes.LINEAR:
            return {
              width: Math.max(
                Math.max(...(tooltipData?.linearData || []).map(item => `${item.name}: ${item.value}`.length)) * 7.5,
                dateLength,
              ),
              height: (tooltipData?.linearData || []).length * 20 + 50,
            };
          case ChartTypes.PRICE_LEVELS:
            return {
              width: (data) => ` | ${data.yVal}`.length * 6 + dateLength,
              height: 40,
            };
          case ChartTypes.TRADES_BBO:
            return {
              width: dateLength,
              height: (data) => (this.pointIsTrade(data.points, data.yVal, this.pointKey(symbol, 'BBO'), this.pointKey(symbol, 'TRADES'))
                ? 68 : 88),
            };
        }
      }),
      filter((dimensions) => !!dimensions),
    );
  }
  
  private getPads(chartType: ChartTypes, colors: StoredColorsMap, showLines: string[]): IEverChartPad[] {
    this.symbolChartHeight = 98 / this.symbolList.length - 0.25;
    switch (chartType) {
      case ChartTypes.TRADES_BBO:
        return this.symbolList.map((symbol, index) => {
          return {
            id: `${symbol}_|_${index}_${ChartTypes.TRADES_BBO}`,
            items: [...this.getAreaLine(symbol, 'BBO', ['askPrice', 'bidPrice']), this.getShape(symbol, 'TRADES')],
            initialHeight: `${(98 / this.symbolList.length).toFixed(2)}%`
          }
        });
      case ChartTypes.BARS:
      case ChartTypes.BARS_BID:
      case ChartTypes.BARS_ASK:
      case ChartTypes.BARS_TRADES:
        const barPads = [];

        this.symbolList.forEach((symbol, index) => {

          barPads.push({
            id: `${symbol}_|_${index}_${ChartTypes.BARS}_0`,
            items: [this.getBarCharLine(symbol, ChartTypes.BARS)],
            initialHeight: `${((this.symbolList.length < 4 ? 75 : 65) / this.symbolList.length).toFixed(2)}%`
          });

          barPads.push({
            id: `${symbol}_|_${index}_${ChartTypes.BARS}_1`,
            items: [this.getBarVolume(symbol, ChartTypes.BARS)],
            initialHeight: `${((this.symbolList.length < 4 ? 23 : 33) / this.symbolList.length).toFixed(2)}%`
          })
        });
        return barPads;
      case ChartTypes.PRICE_LEVELS:
        return this.symbolList.map((symbol, index) => {
          return {
            id: `${symbol}_|_${index}_${ChartTypes.PRICE_LEVELS}`,
            items: [...this.getLines(symbol, 'ASK'), ...this.getLines(symbol, 'BID'), this.getShape(symbol, 'TRADES')],
            initialHeight: `${(98 / this.symbolList.length).toFixed(2)}%`
          }
        })
      case ChartTypes.LINEAR:
        const pads = [];
        this.symbolList.forEach(symbol => {
          if (showLines.length < 2) {
            pads.push({
              id: `${symbol}_|_${ChartTypes.LINEAR}`,
              items: this.getLinearLines(symbol, colors, showLines, 'single'),
              initialHeight: `${(98 / this.symbolList.length).toFixed(2)}%`
            });
          } else {
            pads.push({
              id: `${symbol}_|_${ChartTypes.LINEAR}_0`,
              items: this.getLinearLines(symbol, colors, showLines, 'upper'),
              initialHeight: `${(49 / this.symbolList.length).toFixed(2)}%`
            });
            pads.push({
              id: `${symbol}_|_${ChartTypes.LINEAR}_1`,
              items: this.getLinearLines(symbol, colors, showLines, 'lower'),
              initialHeight: `${(49 / this.symbolList.length).toFixed(2)}%`
            })
          }
        });
        return pads;
      default:
        return [];
    }
  }
  
  private getLinearLines(
    symbol: string, 
    colors: StoredColorsMap, 
    showLines: string[], 
    pad: 'upper' | 'lower' | 'single'): IEverChartPadItem[] {

    return showLines.map(lineKey => ({
      id: `${symbol}_${this.linearId(lineKey)}`,
      type: EverChartPadItem.LINE,
      lineWidth: 2,
      color: this.colorToString(colors[lineKey]),
      getY: (item: DeltixChartFormattedData) => {
        const key = `${this.tabId}_${symbol}`;

        if (pad === 'single') {
          return item.points?.[`${symbol}_${this.linearId(lineKey)}`]?.value as number;
        } else {

          const savedPadLines = this.chartService.getPadLines();
          if (savedPadLines) {
            [this.chartService.upperPadLineList, this.chartService.lowerPadLineList] = savedPadLines;
          }
  
          if (!this.upperPadLineList[key] && this.chartService.upperPadLineList[key]) {
            this.upperPadLineList[key] = this.chartService.upperPadLineList[key];
          }
  
          const isLineFromUpperPad = this.chartService.upperPadLineList[key]?.includes(lineKey);
          if (pad === 'upper' && isLineFromUpperPad) {
            return item.points?.[`${symbol}_${this.linearId(lineKey)}`]?.value as number;
          }
          if (pad === 'lower' && !isLineFromUpperPad) {
            return item.points?.[`${symbol}_${this.linearId(lineKey)}`]?.value as number;
          }  
        }
      }
    }));
  }
  
  private colorToString(color: number[]): string {
    const colorPrefix = color?.length > 3 ? 'rgba' : 'rgb';
    return `${colorPrefix}(${color?.join(',')})`;
  }
  
  private linearId(line: string) {
    return this.linearChartsService.linearId(line);
  }
  
  private getLines(symbolName: string, line: string) {
    const lineKey = `${symbolName}_${line}`;
    const LINES = [];
    for (let i = 0; i < this.LEVELS_COUNT; i++) {
      const LINE_ID = `${lineKey}[${i}]`;
      LINES.push({
        id: LINE_ID,
        type: EverChartPadItem.LINE,
        // renderType: EverChartLineItemRenderType.interrupt,
        drawType: EverChartLineItemDrawType.beforeWithoutLink,
        color: this.getLineColor(lineKey, this.LEVELS_COUNT, i),
        getY: (item: DeltixChartFormattedData) => {
          const value = item.points?.[LINE_ID]?.value;
          this.updateNoPointSymbolList(value, symbolName);
          return value;
        },
      });
    }
    return LINES;
  }
  
  private getAreaLine(symbol: string, linesKey: string, [askPrice, bidPrice]: [string, string]): any[] {
    const linesBaseKey = `${symbol}_${linesKey}`;
    return [
      {
        id: linesBaseKey,
        type: EverChartPadItem.RANGE_AREA,
        color: /*'rgb(255, 255, 255)', */ '#4c6c97',
        drawType1: EverChartLineItemDrawType.after,
        drawType2: EverChartLineItemDrawType.after,
        background2: '#dc0000',
        background1: '#4c6c97',
        getY1: (data: DeltixChartFormattedData | IEverChartDataItem) => {
          const value = data.points?.[linesBaseKey]?.[askPrice];
          this.updateNoPointSymbolList(value, symbol);
          return value;
        },
        getY2: (data: DeltixChartFormattedData | IEverChartDataItem) => {
          return data.points?.[linesBaseKey]?.[bidPrice];
        }
      }
    ];
  }
  
  private getShape(symbolName: string, line: string): IEverChartShapeItem {
    const lineKey = `${symbolName}_${line}`;
    return {
      id: lineKey,
      type: EverChartPadItem.SHAPE,
      shapeColor: '#f6c846',
      shapeSize: 10,
      shapeLineWidth: 2,
      shapeType: EverChartShapeType.cross,
      getY: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        const value = data.points?.[lineKey]?.value;
        this.updateNoPointSymbolList(value, symbolName);
        return value as number;
      },
    };
  }
  
  private getBarCharLine(symbol: string, line: string): IEverChartIntervalItem {
    const green = '#008000';
    const red = '#dc0000';
    const lineKey = `${symbol}_${line}`;
    return {
      id: lineKey,
      type: EverChartPadItem.INTERVAL,
      intervalType: EverChartIntervalType.candle,
      riseColor: green,
      fallColor: red,
      getLow: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        const lowValue = data.points?.[lineKey]?.low;
        return lowValue !== 'NaN' ? lowValue : data.points?.[lineKey]?.close;
      },
      getHigh: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        const value = data.points?.[lineKey]?.high;
        return value !== 'NaN' ? value : data.points?.[lineKey]?.close;
      },
      getOpen: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        const value = data.points?.[lineKey]?.open;
        return value !== 'NaN' ? value : data.points?.[lineKey]?.close;
      },
      getClose: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        return data.points?.[lineKey]?.close;
      },
      getIntervalWidth: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        return data.points?.[lineKey]?.width;
      },
    };
  }

  private getBarVolume(symbol: string, line: string) {
    const lineKey = `${symbol}_${line}`;
    return {
      id: lineKey,
      type: EverChartPadItem.INTERVAL,
      intervalType: EverChartIntervalType.candle,
      fallColor: 'rgba(23, 162, 184, 0.45)',
      riseColor: 'rgba(23, 162, 184, 0.45)',
      getLow: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        if (data.points?.[lineKey]?.volume) {
          return 0;
        }
      },
      getHigh: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        return data.points?.[lineKey]?.volume;
      },
      getOpen: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        if (data.points?.[lineKey]?.volume) {
          return 0;
        }
      },
      getClose: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        return data.points?.[lineKey]?.volume;
      },
      getIntervalWidth: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        return data.points?.[lineKey]?.width * 0.6;
      },
    };
  }
  
  private getLineColor(lineKey: string, maxLevels: number, currentLvl: number, update?: boolean) {
    let lvlStep = 70;
    
    if (/ASK/.test(lineKey)) {
      if (maxLevels > 0) lvlStep = Math.round((255 - lvlStep) / maxLevels);
      // '#f70063';
      return update
        ? `rgb(${255 - lvlStep * currentLvl}, 10, 10)`
        : `rgb(0, ${255 - lvlStep * currentLvl}, 0)`;
    } else {
      if (maxLevels > 0) lvlStep = Math.round((255 - lvlStep) / maxLevels);
      return update
        ? `rgb(10, 10, ${255 - lvlStep * currentLvl})`
        : `rgb(${255 - lvlStep * currentLvl}, 0, 0)`;
    }
  }

  private isChartScrollVisible() { 
    const selectedRange = { start: new Date(this.selectedRange.start), end: new Date(this.selectedRange.end) };
    const symbolRange = { start: new Date(this.symbolRange.start), end: new Date(this.symbolRange.end) };
    return (symbolRange.start < selectedRange.start || symbolRange.end > selectedRange.end) && 
      (+selectedRange.end - +selectedRange.start) / (+symbolRange.end - +symbolRange.start) < 0.8;
  }

  private pointKey(symbol: string, chartType: string) {
    return `${symbol}_${chartType}`;
  }

  private getTargetSymbol(yCoordinate: number) {
    const chartCoordinates = this.container.nativeElement.getBoundingClientRect();
    const chartHeight = chartCoordinates.height;
    const chartTop = chartCoordinates.top;
    const padHeight = Math.round(chartHeight / this.symbolList.length);

    let targetSymbol: string;
    this.symbolList.forEach((symbol, index) => {
      const padTop = chartTop + (index * padHeight);
      const padBottom = padTop + padHeight;
      if (yCoordinate > padTop && yCoordinate <= padBottom) {
        targetSymbol = symbol;
      }
    })
    return targetSymbol;
  }

  updateNoPointSymbolList(value: string | number, symbolName: string) {
    const symbolsWithNoData = this.noPointsSubject$.getValue();
    if (value !== undefined && value !== null && symbolsWithNoData.includes(symbolName)) {
      this.noPointsSubject$.next(symbolsWithNoData.filter(s => s !== symbolName));
    }
  }

  private changeNonTradableHours() {
    this.marketHoursVisible = false;
    this.cdRef.markForCheck();
    setTimeout(() => {
      if (!this.marketHoursVisible) {
        this.marketHoursVisible = true;
      };
    }, 1000);
  }
}