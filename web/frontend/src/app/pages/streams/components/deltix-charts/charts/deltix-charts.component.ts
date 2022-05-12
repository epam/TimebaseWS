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
}                 from '@angular/core';
import { HdDate } from '@assets/hd-date/hd-date';

import { IFormattedNumber }                                                                                from '@deltix/hd.components-common/lib/common';
import {
  EverChartEmbeddableKernel,
  EverChartIntervalType,
  EverChartLineItemDrawType,
  EverChartPadItem,
  everChartScrollToTimeAction,
  EverChartShapeType,
  IEverChartIntervalItem,
  IEverChartPad,
  ZOOM,
}                                                                                                          from '@deltix/hd.components-everchart';
import { IEverChartShapeItem }                                                                             from '@deltix/hd.components-everchart/lib/Store/everChartParams';
import { IEverChartDataItem }                                                                              from '@deltix/hd.components-everchart/lib/Store/everChartState';
import {
  embeddableAppUpdatePositionAction,
  MultiAppFacade,
}                                                                                                          from '@deltix/hd.components-multi-app';
import {
  select,
  Store,
}                                                                                                          from '@ngrx/store';
import equal
                                                                                                           from 'fast-deep-equal';
import {
  ContextMenuComponent,
  ContextMenuService,
}                                                                                                          from 'ngx-contextmenu';
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
import { DebugService }                                                                                    from '../../../../../shared/services/debug.service';
import { GlobalFiltersService }                                                                            from '../../../../../shared/services/global-filters.service';
import { ResizeObserveService }                                                                            from '../../../../../shared/services/resize-observe.service';
import { StreamsService }                                                                                  from '../../../../../shared/services/streams.service';
import { TabStorageService }                                                                               from '../../../../../shared/services/tab-storage.service';
import { formatDateTime }                                                                                  from '../../../../../shared/utils/formatDateTime';
import { appRoute }                                                                                        from '../../../../../shared/utils/routes.names';
import { ChartTypes }                                                                                      from '../../../models/chart.model';
import {
  DEFAULT_ZOOM_TABLE,
  DeltixChartFormattedData,
  DeltixChartRequestModel,
}                                                                                                          from '../../../models/deltix-chart.models';
import { GlobalFilterTimeZone }                                                                            from '../../../models/global.filter.model';
import { TabModel }                                                                                        from '../../../models/tab.model';
import { ChartTrackService }                                                                               from '../../../services/chart-track.service';
import * as StreamsTabsActions
                                                                                                           from '../../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveOrFirstTab,
  getActiveTabFilters,
}                                                                                                          from '../../../store/streams-tabs/streams-tabs.selectors';
import { DeltixChartStorage }                                                                              from '../chart-parts/deltix-chart-storage';
import { DeltixChartFeedService }                                                                          from '../chart-parts/detix-chart-feed.service';
import { EverChartExtension }                                                                              from '../chart-parts/EverChartExtension';
import { zoomRestrictions }                                                                                from './deltix-chart-zoom-limits';

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
    isBBO: boolean;
    yVal: number;
    borderGreen: boolean;
    borderRed: boolean;
    borderBlue: boolean;
  }>;
  tooltipPosition$: Observable<{top: number; left: number; width: number; height: number}>;
  dragging$ = new BehaviorSubject<boolean>(false);
  hideLine$: Observable<boolean>;
  endOfStreamOutOfRange$ = new BehaviorSubject(true);
  showNoData$ = new BehaviorSubject(false);
  viewDataRoute: {route: string[]; params: object};

  private appFacade: MultiAppFacade;
  private destroy$ = new Subject();
  private LEVELS_COUNT = 10;
  private chartDestroy$ = new Subject<void>();
  private resize$ = new Subject<{width: number; height: number}>();
  private mouseMove$ = new ReplaySubject<{
    time: number;
    y: number;
    points: any;
    yVal: number;
    yTime?: number;
  }>(1);
  private filter_timezone: GlobalFilterTimeZone;
  private hideTooltip$ = new BehaviorSubject(false);

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
    private debugService: DebugService,
    private streamsService: StreamsService,
    private elementRef: ElementRef<HTMLElement>,
    private globalSettingService: GlobalFiltersService,
    private chartTrackService: ChartTrackService,
    private contextMenuService: ContextMenuService,
  ) {}

  ngOnInit() {
    this.globalSettings$ = this.globalSettingService.getFilters();
    this.currentTab$ = this.appStore.pipe(select(getActiveOrFirstTab));
    this.debugService.start('deltix-charts');
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

    this.resize$
      .pipe(debounceTime(350), distinctUntilChanged(equal), takeUntil(this.destroy$))
      .subscribe(({width, height}) => {
        this.everChartFeedService.setWidth(width);
        this.onContainerResize(width, height);
      });

    this.tooltipData$ = combineLatest([
      this.mouseMove$.pipe(
        distinctUntilChanged(
          (p: {time: number; points: any; yVal: number}, c) =>
            `${p.time}-${p.yVal}` === `${c.time}-${c.yVal}`,
        ),
      ),
      this.currentTab$,
      this.hideTooltip$,
    ]).pipe(
      auditTime(75),
      map(([moveEvent, tab, hideTooltip]) => {
        if (!moveEvent.time || hideTooltip) {
          return null;
        }

        const point = JSON.parse(JSON.stringify(moveEvent.points));
        const isBars = tab?.filter.chart_type === ChartTypes.BARS;
        const isBBO = tab?.filter.chart_type === ChartTypes.TRADES_BBO;

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

        return {
          time: formatDateTime(moveEvent.time, this.format, this.filter_timezone.name),
          point,
          yVal: moveEvent.yVal,
          isBars,
          isL2: tab?.filter.chart_type === ChartTypes.PRICES_L2,
          isBBO,
          borderGreen,
          borderRed,
          borderBlue,
        };
      }),
    );

    this.tooltipPosition$ = combineLatest([
      this.mouseMove$,
      this.tooltipDimensions(),
      this.currentTab$.pipe(
        map((tab) => ({
          from: tab?.filter ? new Date(tab.filter.from).getTime() : 0,
          to: tab?.filter ? new Date(tab.filter.to).getTime() : 0,
        })),
      ),
    ]).pipe(
      map(([data, dimensions, {from, to}]) => {
        const {height, width} = this.getSize();
        const bottomPadding = 25;
        const mousePadding = 10;
        if (!data.time) {
          return null;
        }

        const dimensionHeight =
          typeof dimensions.height === 'function' ? dimensions.height(data) : dimensions.height;

        const dimensionWidth =
          typeof dimensions.width === 'function' ? dimensions.width(data) : dimensions.width;
        const widthInMs = to - from;
        const xInPx = Math.max(0, ((data.time - from) / widthInMs) * width) - mousePadding;
        const left = xInPx - dimensionWidth < 0 ? xInPx + mousePadding * 2 : xInPx - dimensionWidth;

        return {
          top: Math.min(
            Math.max(0, data.y - dimensionHeight - mousePadding),
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
    ]).pipe(map(([dragging, outOfRange]) => dragging || outOfRange));
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
              action.payload.startTime,
              action.payload.endTime,
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

    combineLatest([this.globalSettings$, this.currentTab$])
      .pipe(
        distinctUntilChanged(([settings1, tab1], [settings2, tab2]) => {
          const compareTab1 = JSON.parse(JSON.stringify(tab1));
          const compareTab2 = JSON.parse(JSON.stringify(tab2));
          delete compareTab1?.filter.chart_width_val;
          delete compareTab2?.filter.chart_width_val;
          delete compareTab2?.filter.silent;
          delete compareTab2?.filter.silent;
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
        filter(({filter}) => !(filter.chart_type === ChartTypes.BARS && !filter.period)),
        switchMap((tab: TabModel) => {
          return combineLatest([
            this.streamsService.rangeCached(
              tab.stream,
              tab.symbol,
              tab.space,
              tab.filter.chart_type === ChartTypes.BARS ? tab.filter.period.aggregation : null,
            ),
            this.streamsService.rangeCached(tab.stream, tab.symbol, tab.space),
          ]).pipe(map(([range, pureRange]) => [range, pureRange.end, tab]));
        }),
        debounceTime(300),
        takeUntil(this.destroy$),
      )
      .subscribe(
        ([{end, start}, pureRangeEnd, tab]: [{end: string; start: string}, string, TabModel]) => {
          if (!tab.filter.chart_type) {
            return;
          }

          this.endOfStreamOutOfRange$.next(true);
          this.LEVELS_COUNT = tab.filter.levels;
          this.destroyChart();
          if (!this.appFacade) {
            return;
          }

          this.initChart(
            {
              stream: tab.stream,
              symbol: tab.symbol,
              levels: tab.filter.levels,
              to: new HdDate(tab.filter.to).getEpochMillis(),
              from: new HdDate(tab.filter.from).getEpochMillis(),
              streamRange: {start: new Date(start).getTime(), end: new Date(end).getTime()},
              pureRangeEnd: new Date(pureRangeEnd).getTime(),
              ...(tab.space ? {space: tab.space} : {}),
            },
            tab,
          );
        },
      );
  }

  onChartMouseLeave() {
    this.hideTooltip$.next(true);
    timer(100).subscribe(() =>
      this.mouseMove$.next({time: null, y: null, points: null, yVal: null}),
    );
  }

  onChartMouseEnter() {
    this.hideTooltip$.next(false);
  }

  ngOnDestroy(): void {
    this.destroyChart();
    this.destroy$.next(true);
    this.destroy$.complete();
    this.everChartFeedService.chartDestroy();
    this.appFacade.destroy();
    this.appFacade = null;
    this.debugService.end('deltix-charts');
  }

  private getSize(): {width: number; height: number} {
    const el = this.container.nativeElement.parentElement.parentElement;
    return {width: el.clientWidth, height: el.clientHeight};
  }

  private onContainerResize(width: number, height: number) {
    this.debugService.log(() => ({action: 'resize', payload: {width, height}}));
    this.appFacade.dispatch(
      embeddableAppUpdatePositionAction('everChart', '1', {
        width: width,
        height: height,
        x: 0,
        y: 0,
      }),
    );
  }

  private destroyChart() {
    if (this.appFacade?.destroyApp) {
      this.everChartFeedService.chartDestroy();
      this.appFacade.destroyApp('everChart', '1');
      this.chartDestroy$.next();
    }
  }

  private initChart(requestData: DeltixChartRequestModel, TAB: TabModel) {
    this.setZoomAndIntervals(TAB.filter.chart_type, TAB.filter.period);
    this.hideTooltip$.next(true);
    const fromTime = new Date(TAB.filter.from).getTime();
    const minTime = Math.min(requestData.streamRange.start, fromTime);
    this.debugService.log(() => ({
      action: 'init',
      payload: {
        initialTime: [
          new Date(TAB.filter.from).toISOString(),
          new Date(TAB.filter.to).toISOString(),
        ],
        minTime: new Date(minTime).toISOString(),
        filters: {
          ...TAB.filter,
          from: new Date(TAB.filter.from).toISOString(),
          to: new Date(TAB.filter.from).toISOString(),
        },
      },
    }));
    const chartConfig = {
      pads: this.getPads(TAB.filter.chart_type),
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

    this.everChartFeedService.chartInit(
      new Date(TAB.filter.from).getTime(),
      new Date(TAB.filter.to).getTime(),
      this.tabStorageService,
      TAB.filter.period?.aggregation,
      TAB.filter.levels,
      TAB.filter.chart_type,
      requestData.pureRangeEnd,
      requestData.streamRange.end,
    );

    const {width, height} = this.getSize();
    this.everChartFeedService.setWidth(width);
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
      )
      .subscribe((value) => {
        if (value === 'initialized') {
          this.hideTooltip$.next(false);
          this.resize$.next(this.getSize());
          this.resizeObserveService
            .observe(this.container.nativeElement.parentElement.parentElement)
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

          combineLatest([borders$, this.everChartFeedService.onEndOfStream()])
            .pipe(
              takeUntil(this.chartDestroy$),
              withLatestFrom(this.chartTrackService.onTrack()),
              switchMap(([data, track]) => {
                return timer(track ? 300 : 0).pipe(map(() => data));
              }),
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
              const halfScreen = Math.ceil(
                (new Date(tab.filter.to).getTime() - new Date(tab.filter.from).getTime()) / 2,
              );

              this.appFacade.dispatchTo(
                everChartScrollToTimeAction(time + halfScreen),
                'everChart',
                '1',
              );
            });
        }
      });
  }

  private setZoomAndIntervals(chartType: ChartTypes, period: BarChartPeriod): void {
    ZOOM.zoom =
      chartType === ChartTypes.BARS ? zoomRestrictions(period.aggregation) : DEFAULT_ZOOM_TABLE;
    ZOOM.intervals = Object.keys(ZOOM.zoom).map((key) => parseInt(key, 0));
  }

  private tooltipDimensions(): Observable<{width: number | Function; height: number | Function}> {
    return combineLatest([
      this.currentTab$.pipe(filter(Boolean)),
      this.globalSettingService.getFilters(),
    ]).pipe(
      map(([tab, filters]: [TabModel, GlobalFilters]) => {
        const dateLength = `${filters.dateFormat[0]} ${filters.timeFormat[0]}`.length * 7 + 20;
        switch (tab.filter.chart_type) {
          case ChartTypes.BARS:
            return {
              width: dateLength,
              height: 125,
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

  private getPads(chartType: ChartTypes): IEverChartPad[] {
    switch (chartType) {
      case ChartTypes.TRADES_BBO:
        return [
          {
            id: `1_${ChartTypes.TRADES_BBO}`,
            items: [...this.getAreaLine('BBO', ['askPrice', 'bidPrice']), this.getShape('TRADES')],
          },
        ];
      case ChartTypes.BARS:
        return [
          {
            id: `1_${ChartTypes.BARS}`,
            items: [this.getBarCharLine(ChartTypes.BARS)],
          },
        ];
      case 'PRICES_L2':
        return [
          {
            id: `1_${ChartTypes.PRICES_L2}`,
            items: [...this.getLines('ASK'), ...this.getLines('BID'), this.getShape('TRADES')],
          },
        ];
      default:
        return [];
    }
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
          return item.points?.[LINE_ID]?.value /* || NaN*/;
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
