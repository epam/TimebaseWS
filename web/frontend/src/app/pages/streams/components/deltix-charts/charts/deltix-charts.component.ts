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

interface MouseMoveEvent {
  time: number;
  y: number;
  points: any;
  yVal: number;
  yTime?: number;
}

@Component({
  selector: 'app-deltix-charts',
  templateUrl: './deltix-charts.component.html',
  styleUrls: ['./deltix-charts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeltixChartsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartRef', {read: ElementRef, static: false}) public container: ElementRef;
  @ViewChild(ContextMenuComponent) public contextMenuComponent: ContextMenuComponent;
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
  noPoints$: Observable<boolean>;
  magnetCoordinates$: Observable<{x: number, y: number, yInPx: number}>;
  
  private appFacade: MultiAppFacade;
  private destroy$ = new Subject();
  private LEVELS_COUNT = 10;
  private chartDestroy$ = new Subject<void>();
  private resize$ = new Subject<{ width: number; height: number }>();
  private mouseMove$ = new ReplaySubject<MouseMoveEvent>(1);
  private filter_timezone: GlobalFilterTimeZone;
  private hideTooltip$ = new BehaviorSubject(false);
  private retry$ = new Subject();
  
  // @HostListener('document:keydown', ['$event']) keydown(event) {
  //   if (event.key === 'd') {
  //     this.tabStorageService.getData().pipe(take(1)).subscribe(storage => {
  //       const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(storage));
  //       const dlAnchorElem = document.createElement('a');
  //       dlAnchorElem.setAttribute('href',     dataStr     );
  //       dlAnchorElem.setAttribute('download', 'storage.json');
  //       dlAnchorElem.click();
  //     });
  //   }
  //
  // }
  @HostListener('click', ['$event']) onClick() {
    this.tabNavigationService
      .focusFirstFocusableElement(this.elementRef.nativeElement.closest('as-split-area'));
  }
  
  @HostListener('contextmenu', ['$event']) onRightClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    combineLatest([this.currentTab$, this.mouseMove$])
      .pipe(take(1))
      .subscribe(([tab, move]) => {
        const route = ['/', appRoute, 'symbol', 'view', tab.stream, tab.symbol];
        const params = {
          chartType: tab.chartType,
          newTab: 1,
          isView: tab.isView,
          streamName: tab.streamName,
          space: tab.space,
          'tabFilters:from': new Date(move.yTime).toISOString(),
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
    private zone: NgZone,
    private everChartFeedService: DeltixChartFeedService,
    private tabStorageService: TabStorageService<DeltixChartStorage>,
    private resizeObserveService: ResizeObserveService,
    private streamsService: StreamsService,
    private elementRef: ElementRef<HTMLElement>,
    private globalSettingService: GlobalFiltersService,
    private chartTrackService: ChartTrackService,
    private contextMenuService: ContextMenuService,
    private chartExchangeService: ChartExchangeService,
    private linearChartsService: LinearChartService,
    private chartsHttpService: ChartsHttpService,
    private tabNavigationService: TabNavigationService,
  ) {}
  
  ngOnInit() {
    this.globalSettings$ = this.globalSettingService.getFilters();
    this.currentTab$ = this.appStore.pipe(select(getActiveOrFirstTab));
    this.httpError$ = this.everChartFeedService.onHttpError();
    this.httpErrorText$ = this.httpError$.pipe(map(httpError => httpError.error.message || httpError.error.error));
    
    this.noPoints$ = this.everChartFeedService.onNoPoints();
    
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
        const storageAndColors$: Observable<[{ colors: StoredColorsMap, showLines: string[] }, Partial<DeltixChartStorage> | null]> = moveEvent.points && tab.filter.chart_type === ChartTypes.LINEAR ?
          combineLatest([this.linearChartsService.showLinesAndColors(), this.everChartFeedService.storage$.pipe(filter(s => !!s?.data))]) :
          of([{colors: {}, showLines: []}, null]);
        
        return storageAndColors$.pipe(
          map(([linesAndColors, storage]) => [moveEvent, tab, hideTooltip, linesAndColors, storage]),
        );
      }),
      
      map(([moveEvent, tab, hideTooltip, linesAndColors, storage]: [MouseMoveEvent, TabModel, boolean, { colors: StoredColorsMap, showLines: string[] }, Partial<DeltixChartStorage> | null]) => {
        if (!moveEvent.time || hideTooltip) {
          return null;
        }
        
        const point = JSON.parse(JSON.stringify(moveEvent.points));
        const isBars = barChartTypes.includes(tab?.filter.chart_type);
        const isBBO = tab?.filter.chart_type === ChartTypes.TRADES_BBO;
        const isLinear = tab.filter.chart_type === ChartTypes.LINEAR;
        
        if (this.pointIsTrade(point, moveEvent.yVal)) {
          delete point.BBO;
        } else {
          delete point.TRADES;
        }
        
        const borderGreen =
          (point.BARS && point.BARS.open < point.BARS.close) ||
          (point.BBO && point.BBO.askPrice > point.BBO.bidPrice);
        const borderRed =
          (point.BARS && point.BARS.open > point.BARS.close) ||
          (point.BBO && point.BBO.askPrice < point.BBO.bidPrice);
        
        const borderBlue = !borderRed && !borderGreen;
        
        let borderColor = null;
        const colorNames = {};
        Object.keys(linesAndColors.colors).forEach(key => colorNames[this.linearId(key)] = key);
        if (isLinear) {
          const lineName = Object.keys(point).find(key => moveEvent.yVal === point[key].value);
          if (lineName) {
            borderColor = this.colorToString(linesAndColors.colors[colorNames[lineName]]);
          }
        }
        
        let from;
        let to;
        
        if (point.BARS) {
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
              values[key] = p.points[key].value;
            });
            return isCurrent;
          });
        }
  
        const linearData = linesAndColors.showLines.map(line => {
          let value = values[this.linearId(line)];
      
          if (value === undefined || isNaN(value)) {
            value = '-';
          }
    
          return {
            name: line,
            value,
            isHighlight: moveEvent.yVal === point[this.linearId(line)]?.value,
            highlightColor: this.colorToString(linesAndColors.colors[line]),
          };
        });
        
        return {
          time: formatDateTime(moveEvent.time, this.format, this.filter_timezone.name),
          point,
          from,
          to,
          yVal: moveEvent.yVal,
          isBars,
          isL2: tab?.filter.chart_type === ChartTypes.PRICES_L2,
          isLinear,
          linearData,
          isBBO,
          borderGreen,
          borderRed,
          borderBlue,
          borderColor,
        };
      }),
    );
  
    this.magnetCoordinates$ = combineLatest([
      this.mouseMove$,
      this.currentTab$.pipe(
        map((tab) => ({
          from: tab?.filter ? new Date(tab.filter.from).getTime() : 0,
          to: tab?.filter ? new Date(tab.filter.to).getTime() : 0,
        })),
      ),
    ]).pipe(map((([data, {from, to}]) => {
      const {width, height} = this.getSize();
      if (!data.time) {
        return null;
      }
      
      let yInPx = 0;
      const widthInMs = to - from;
      const xCoordRatio = data.time <= to ? (data.time - from) / widthInMs : 0.95;
      const x = Math.max(0, Math.round(xCoordRatio * width));
      
      const pads = this.appFacade.getStateFor('everChart', '1').app.pads;
      if (pads.LINEAR) {
        const pad = pads.LINEAR;
        const decimalsL = pad.max.next.toString().split('.')[1]?.length || 0;
        const multi = Math.pow(10, decimalsL);
        
        yInPx = this.getYCoordinate(data.yVal * multi, height, pad.min.next * multi, pad.max.next * multi);
      }
     
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
        
        return {
          top: Math.min(
            Math.max(0, coordinates.y - dimensionHeight - mousePadding),
            height - bottomPadding - dimensionHeight,
          ),
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
      this.noPoints$,
    ]).pipe(
      map(
        ([dragging, outOfRange, httpError, noPoints]) =>
          dragging || outOfRange || !!httpError || noPoints,
      ),
    );
  }
  
  private getYCoordinate = (
    value: number,
    height: number,
    min: number,
    max: number,
  ) => {
    const yOffset = (height * 0.1) / 2;
  
    const domain = { from: min, to: max };
    const range = { from: height - yOffset, to: yOffset };
    const rise = range.from - range.to;
  
    const run = domain.from - domain.to;
  
    if (rise === 0 || run === 0) {
      return 0;
    }
  
    const slope = rise / run;
  
    const intercept = range.from - slope * domain.from;
  
    return slope * value + intercept;
  };
  
  private formatTooltipBarTime(aggregation: number, time: number) {
    switch (true) {
      case aggregation < day:
        return formatDateTime(time, this.format, this.filter_timezone.name);
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
  
  private pointIsTrade(point, yVal) {
    if (!point.BBO && point.TRADES) {
      return true;
    }
    
    if (!point.TRADES && point.BBO) {
      return false;
    }
    
    if (point.TRADES && point.BBO) {
      return yVal === point.TRADES.value;
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
            if (action.payload.drag) {
              this.chartTrackService.track(false);
            }
            
            this.dragging$.next(action.payload.drag);
            break;
          case '@EC/ZOOM':
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
    combineLatest([this.globalSettings$, this.currentTab$])
      .pipe(
        distinctUntilChanged(([settings1, tab1], [settings2, tab2]) => {
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
            JSON.stringify([settings1, compareTab1]) === JSON.stringify([settings2, compareTab2])
          );
        }),
        map(([settings, tab]) => tab),
        filter(
          (tab) => !!(tab && tab.filter && tab.filter.from && tab.filter.to && !tab.filter.silent),
        ),
        filter(({filter}) => !!filter.chart_type),
        filter(({filter}) => !(filter.chart_type === ChartTypes.PRICES_L2 && !filter.levels)),
        filter(({filter}) => !(barChartTypes.includes(filter.chart_type) && !filter.period)),
        switchMap((tab: TabModel) => {
          this.everChartFeedService.resetHttpError();
          this.hideTooltip();
          return combineLatest([
            this.streamsService.rangeCached(
              tab.stream,
              tab.symbol,
              tab.space,
              barChartTypes.includes(tab.filter.chart_type) ? tab.filter.period.aggregation : null,
            ),
            this.streamsService.rangeCached(tab.stream, tab.symbol, tab.space),
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
      )
      .subscribe(
        ([{
          end,
          start,
        }, pureRangeEnd, tab, linesAndColors]: [{ end: string; start: string }, string, TabModel, { colors: StoredColorsMap, lines: string[] }]) => {
          if (!tab.filter.chart_type) {
            return;
          }
          
          this.endOfStreamOutOfRange$.next(true);
          this.LEVELS_COUNT = tab.filter.levels;
          if (!this.appFacade) {
            return;
          }
          
          this.destroyChart();
          this.setZoomAndIntervals(tab.filter.chart_type, tab.filter.period);
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
          );
          
          this.initChart(tab, new Date(start).getTime(), linesAndColors.colors, linesAndColors.lines);
        });
  }
  
  private hideTooltip() {
    this.hideTooltip$.next(true);
    timer(100).subscribe(() =>
      this.mouseMove$.next({time: null, y: null, points: null, yVal: null}),
    );
  }
  
  private getSize(): { width: number; height: number } {
    const el = this.container.nativeElement;
    return {width: el.clientWidth, height: el.clientHeight};
  }
  
  private onContainerResize(width: number, height: number) {
    this.appFacade.dispatch(
      embeddableAppUpdatePositionAction('everChart', '1', {
        width: width,
        height: height,
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
          const formatted_date_string = formatDateTime(
            tick,
            this.format,
            this.filter_timezone.name,
          );
          return formatted_date_string + ' ';
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
            format = 'dd/MM';
          }
          
          return formatDateTime(tick, format, this.filter_timezone.name);
        },
        yAxis: (numberToFormat: string, an): IFormattedNumber => {
          const decimals = this.everChartFeedService.maxDecimals$.getValue();
          
          const split = parseFloat(numberToFormat.toString())
            .toFixed(decimals || 1)
            .toString()
            .split('.');
          
          return {
            integerPart: split[0],
            fractionalPart: split[1],
            decimalSeparator: '.',
          };
        },
      },
    };
    
    this.everChartFeedService.runChart();
    
    const {width, height} = this.getSize();
    
    this.appFacade
      .createApp(
        'everChart',
        '1',
        {
          height,
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
  }
  
  private setZoomAndIntervals(chartType: ChartTypes, period: BarChartPeriod): void {
    ZOOM.zoom = barChartTypes.includes(chartType)
      ? zoomRestrictions(period.aggregation)
      : DEFAULT_ZOOM_TABLE;
    ZOOM.intervals = Object.keys(ZOOM.zoom).map((key) => parseInt(key, 0));
  }
  
  private tooltipDimensions(): Observable<{ width: number | Function; height: number | Function }> {
    return combineLatest([
      this.currentTab$.pipe(filter(Boolean)),
      this.globalSettingService.getFilters(),
      this.tooltipData$,
    ]).pipe(
      map(([tab, filters, tooltipData]: [TabModel, GlobalFilters, any]) => {
        const isBars = [ChartTypes.BARS, ChartTypes.BARS_BID, ChartTypes.BARS_ASK].includes(tab.filter.chart_type);
        const date = isBars ? this.formatTooltipBarTime(tab.filter.period?.aggregation, 0) : `${filters.dateFormat[0]} ${filters.timeFormat[0]}`;
        const dateLength = date.length * 7 + 20 + (isBars ? 30 : 0);
        
        switch (tab.filter.chart_type) {
          case ChartTypes.BARS:
          case ChartTypes.BARS_BID:
          case ChartTypes.BARS_ASK:
            return {
              width: (data) => {
                const barsData = data.points.BARS;
                const barValuesLengths = [
                  `High: ${barsData?.high}`,
                  `Low: ${barsData?.low}`,
                  `Open: ${barsData?.open}`,
                  `Close: ${barsData?.close}`,
                ].map(val => `${val}`.length * 7.5);
                return Math.max(dateLength, ...barValuesLengths);
              },
              height: 145,
            };
          case ChartTypes.LINEAR:
            return {
              width: Math.max(
                Math.max(...(tooltipData?.linearData || []).map(item => `${item.name}: ${item.value}`.length)) * 7.5,
                dateLength,
              ),
              height: (tooltipData?.linearData || []).length * 20 + 50,
            };
          case ChartTypes.PRICES_L2:
            return {
              width: (data) => ` | ${data.yVal}`.length * 6 + dateLength,
              height: 40,
            };
          case ChartTypes.TRADES_BBO:
            return {
              width: dateLength,
              height: (data) => (this.pointIsTrade(data.points, data.yVal) ? 68 : 88),
            };
        }
      }),
      filter((dimensions) => !!dimensions),
    );
  }
  
  private getPads(chartType: ChartTypes, colors: StoredColorsMap, showLines: string[]): IEverChartPad[] {
    switch (chartType) {
      case ChartTypes.TRADES_BBO:
        return [
          {
            id: `1_${ChartTypes.TRADES_BBO}`,
            items: [...this.getAreaLine('BBO', ['askPrice', 'bidPrice']), this.getShape('TRADES')],
          },
        ];
      case ChartTypes.BARS:
      case ChartTypes.BARS_BID:
      case ChartTypes.BARS_ASK:
        return [
          {
            id: `1_${ChartTypes.BARS}`,
            items: [this.getBarCharLine(ChartTypes.BARS)],
          },
        ];
      case ChartTypes.PRICES_L2:
        return [
          {
            id: `1_${ChartTypes.PRICES_L2}`,
            items: [...this.getLines('ASK'), ...this.getLines('BID'), this.getShape('TRADES')],
          },
        ];
      case ChartTypes.LINEAR:
        return [
          {
            id: ChartTypes.LINEAR,
            items: this.getLinearLines(colors, showLines),
          },
        ];
      default:
        return [];
    }
  }
  
  private getLinearLines(colors: StoredColorsMap, showLines: string[]): IEverChartPadItem[] {
    
    return showLines.map(lineKey => ({
      id: this.linearId(lineKey),
      type: EverChartPadItem.LINE,
      lineWidth: 2,
      color: this.colorToString(colors[lineKey]),
      getY: (item: DeltixChartFormattedData) => {
        return item.points?.[this.linearId(lineKey)]?.value as number;
      },
    }));
  }
  
  private colorToString(color: number[]): string {
    const colorPrefix = color.length > 3 ? 'rgba' : 'rgb';
    return `${colorPrefix}(${color.join(',')})`;
  }
  
  private linearId(line: string) {
    return this.linearChartsService.linearId(line);
  }
  
  private getLines(lineKey: string) {
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
          return item.points?.[LINE_ID]?.value;
        },
      });
    }
    return LINES;
  }
  
  private getAreaLine(linesBaseKey: string, [askPrice, bidPrice]: [string, string]): any[] {
    return [
      {
        id: linesBaseKey,
        type: EverChartPadItem.RANGE_AREA,
        color: /*'rgb(255, 255, 255)', */ '#4c6c97',
        drawType1: EverChartLineItemDrawType.after,
        drawType2: EverChartLineItemDrawType.after,
        background2: '#dc0000',
        background1: '#4c6c97',
        getY1: (data: DeltixChartFormattedData | IEverChartDataItem) =>
          data.points?.[linesBaseKey]?.[askPrice],
        getY2: (data: DeltixChartFormattedData | IEverChartDataItem) =>
          data.points?.[linesBaseKey]?.[bidPrice],
      },
    ];
  }
  
  private getShape(lineKey: string): IEverChartShapeItem {
    return {
      id: lineKey,
      type: EverChartPadItem.SHAPE,
      shapeColor: '#f6c846',
      shapeSize: 10,
      shapeLineWidth: 2,
      shapeType: EverChartShapeType.cross,
      getY: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        if (data.points && data.points[lineKey]) {
          return data.points?.[lineKey]?.value as number;
        }
        return null;
      },
    };
  }
  
  private getBarCharLine(lineKey: string): IEverChartIntervalItem {
    const green = '#008000';
    const red = '#dc0000';
    return {
      id: lineKey,
      type: EverChartPadItem.INTERVAL,
      intervalType: EverChartIntervalType.candle,
      riseColor: green,
      fallColor: red,
      getLow: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        if (!data.points?.[lineKey]) {
          return null;
        }
        
        return parseFloat(data.points[lineKey].low);
      },
      getHigh: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        if (!data.points?.[lineKey]) {
          return null;
        }
        
        return parseFloat(data.points[lineKey].high);
      },
      getOpen: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        if (!data.points?.[lineKey]) {
          return null;
        }
        return parseFloat(data.points[lineKey].open);
      },
      getClose: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        if (!data.points?.[lineKey]) {
          return null;
        }
        
        return parseFloat(data.points[lineKey].close);
      },
      getIntervalWidth: (data: DeltixChartFormattedData | IEverChartDataItem) => {
        if (!data.points?.[lineKey]) {
          return null;
        }
        
        return data.points[lineKey].width;
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
}
