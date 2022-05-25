import { HttpClient }                                                                   from '@angular/common/http';
import { Injectable }                                                                   from '@angular/core';
import {
  IEverChartFeed,
  IEverChartFeedHistoryOptions,
  IEverChartFeedOptions,
}                                                                                       from '@deltix/hd.components-everchart';
import { select, Store }                                                                from '@ngrx/store';
import equal                                                                            from 'fast-deep-equal';
import { BehaviorSubject, combineLatest, Observable, of, Subject, Subscription, timer } from 'rxjs';
import {
  auditTime,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  mapTo,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
}                                                                                       from 'rxjs/operators';
import { WSService }                                                                    from '../../../../../core/services/ws.service';
import { AppState }                                                                     from '../../../../../core/store';
import { DebugService }                                                                 from '../../../../../shared/services/debug.service';
import { TabStorageService }                                                            from '../../../../../shared/services/tab-storage.service';
import {
  ChartModel,
  ChartRowLines,
  ChartTypes,
}                                                                                       from '../../../models/chart.model';
import { DeltixChartFormattedData }                                                     from '../../../models/deltix-chart.models';
import { TabModel }                                                                     from '../../../models/tab.model';
import { getActiveTab }                                                                 from '../../../store/streams-tabs/streams-tabs.selectors';
import { DeltixChartStorage }                                                           from './deltix-chart-storage';

@Injectable()
export class DeltixChartFeedService implements IEverChartFeed {
  maxDecimals$ = new BehaviorSubject<number>(0);

  private borders$ = new BehaviorSubject<[number, number]>([0, 0]);
  private chartDestroy$ = new Subject<void>();
  private storageService: TabStorageService<DeltixChartStorage>;
  private width: number;
  private actualInterval$ = new BehaviorSubject<number>(null);
  private barsAggregation: number;
  private levels: number;
  private chartType: ChartTypes;
  private initEndOfStream: number;
  private initEndOfStreamNotRounded: number;
  private endOfStream$ = new BehaviorSubject<number>(0);
  private loading$ = new BehaviorSubject<number>(0);
  private chartInit$ = new BehaviorSubject(false);
  private socketSubscription?: Subscription;

  constructor(
    private httpClient: HttpClient,
    private appStore: Store<AppState>,
    private debugService: DebugService,
    private wsService: WSService,
  ) {}

  request(options: IEverChartFeedHistoryOptions): Observable<DeltixChartFormattedData[]> {
    this.zoomIntervalChange(options.interval);
    return combineLatest([this.getActiveTab(), this.chartInit$]).pipe(
      filter(([tab, chartInit]) => !chartInit),
      take(1),
      map(([tab]) => {
        return this.closePoints(
          new Date(tab.filter.from).getTime() - 60 * 1000,
          new Date(tab.filter.to).getTime() + 60 * 1000,
        );
      }),
    );
  }

  subscribe(options: IEverChartFeedOptions): Observable<DeltixChartFormattedData[]> {
    return combineLatest([this.storageService.getData(['data']), this.borders$]).pipe(
      map(([storage, [left, right]]) => {
        const barSize = storage?.chartType === ChartTypes.BARS ? storage?.barsAggregation : 0;
        const tail = Math.max(60 * 1000, barSize);
        const filterLeft = left - tail;
        const filterRight = right + tail;
        return (storage?.data || []).filter(({time}) => time >= filterLeft && time <= filterRight);
      }),
      distinctUntilChanged(equal),
    );
  }

  private closePoints(from: number, to: number) {
    return [
      {time: from, points: {}},
      {time: to, points: {}},
    ];
  }

  onEndOfStream(): Observable<number> {
    return this.endOfStream$.asObservable();
  }

  bordersChange(start: number, end: number): void {
    const [currentStart, currentEnd] = this.borders$.getValue();
    if (start !== currentStart || currentEnd !== end) {
      this.borders$.next([start, end]);
    }
  }

  zoomIntervalChange(interval: number): void {
    if (interval !== this.actualInterval$.getValue()) {
      this.actualInterval$.next(interval);
    }
  }

  setWidth(width: number): void {
    this.width = width;
  }

  chartInit(
    start: number,
    end: number,
    tabStorageService: TabStorageService<DeltixChartStorage>,
    barsAggregation: number,
    levels: number,
    chartType: ChartTypes,
    initEndOfStreamNotRounded: number,
    endOfStream: number,
  ) {
    this.storageService = tabStorageService;
    this.barsAggregation = barsAggregation;
    this.levels = levels;
    this.chartType = chartType;
    this.initEndOfStream = endOfStream;
    this.initEndOfStreamNotRounded = initEndOfStreamNotRounded;
    this.bordersChange(start, end);
    this.endOfStream$.next(endOfStream);
    this.chartInit$.next(true);
    this.borders$.next([start, end]);
    this.socketSubscription?.unsubscribe();
    this.socketSubscription = null;
    this.borders$
      .pipe(
        distinctUntilChanged(equal),
        filter(([left, right]) => left !== 0 || right !== 0),
      )
      .pipe(
        auditTime(300),
        withLatestFrom(this.actualInterval$.pipe(filter((i) => i !== null))),
        map(([borders, actualInterval]: [[number, number], number]) => {
          const [startDate, endDate] = borders;
          this.debugService.log(() => ({
            action: 'borders changed',
            payload: {
              startDate: new Date(startDate).toISOString(),
              endDate: new Date(endDate).toISOString(),
            },
          }));

          return [startDate, endDate, this.tail(), actualInterval];
        }),
        switchMap(
          ([startDate, endDate, tail, actualInterval]: [number, number, number, number]) => {
            const storageData = this.storageService.snapShot;
            let endOfStream = this.endOfStream$.getValue();
            if (chartType === ChartTypes.BARS) {
              endOfStream -= barsAggregation / 2;
            }
            const needEnd = Math.min(endDate + tail, endOfStream);
            const needStart = Math.min(startDate - tail, needEnd);
            let subRanges;

            const intervalChanged =
              storageData?.chartType === chartType && chartType === ChartTypes.BARS
                ? false
                : actualInterval !== storageData?.interval;

            this.debugService.log(() => ({
              action: 'intervalChanged',
              payload: intervalChanged,
            }));

            const freshStorage =
              !storageData ||
              intervalChanged ||
              storageData.barsAggregation !== barsAggregation ||
              storageData.levels !== levels ||
              storageData.chartType !== chartType;
            this.debugService.log(() => ({
              action: 'freshStorage',
              payload: freshStorage,
            }));

            if (!freshStorage) {
              let point = needStart;
              subRanges = [];
              const knownRanges = storageData.knownRanges || [];
              while (point < needEnd) {
                const known = knownRanges.find(([start, end]) => point <= end && point >= start);
                if (known) {
                  point = known[1] + 1;
                } else {
                  const next = knownRanges.find(([start]) => start > point);
                  const subRange = [point - 1, next ? Math.min(next[0] - 1, needEnd) : needEnd];
                  subRanges.push(subRange);
                  point = subRange[1] + 1;
                }
              }

              this.debugService.log(() => ({
                action: 'subRanges without fresh',
                payload: subRanges?.map((r) => r.map((t) => new Date(t).toISOString())),
              }));
            } else {
              subRanges = [[needStart, needEnd]];
              this.debugService.log(() => ({
                action: 'subRanges on fresh',
                payload: subRanges?.map((r) => r.map((t) => new Date(t).toISOString())),
              }));
            }

            const clear$ = freshStorage
              ? this.storageService.updateData((storage) => ({track: storage?.track}))
              : of(null);

            return clear$.pipe(
              switchMap(() =>
                this.fillRanges(
                  subRanges as [number, number][],
                  needStart,
                  needEnd,
                  actualInterval,
                ),
              ),
              tap(() => this.chartInit$.next(false)),
              map(() => freshStorage),
            );
          },
        ),
        takeUntil(this.chartDestroy$),
      )
      .subscribe((freshStorage) => {
        if (freshStorage || !this.socketSubscription) {
          this.socketSubscription?.unsubscribe();
          this.socketSubscription = this.socketsSubscription()
            .pipe(takeUntil(this.chartDestroy$))
            .subscribe();
        }
      });

    this.subscribeMaxDecimals(this.storageService);
  }

  chartDestroy() {
    this.chartDestroy$.next();
    this.borders$.next([0, 0]);
    this.actualInterval$.next(null);
  }

  onLoading(): Observable<boolean> {
    return this.loading$.pipe(map((processes) => processes > 0));
  }

  private subscribeMaxDecimals(storageService: TabStorageService<DeltixChartStorage>) {
    combineLatest([this.borders$, storageService.getData(['data'])])
      .pipe(
        debounceTime(50),
        map(([[left, right], storage]) => {
          const data = storage?.data?.filter((point) => point.time >= left && point.time <= right);
          if (!data?.length) {
            return 0;
          }

          return Math.max(
            ...data.map((point) => {
              switch (storage.chartType) {
                case ChartTypes.BARS:
                  const params = point.points.BARS;
                  return this.getMaxDecimals([
                    params.low,
                    params.high,
                    params.open,
                    params.close,
                  ] as number[]);
                case ChartTypes.PRICES_L2:
                  return this.getMaxDecimals(
                    Object.keys(point.points).map((key) => point.points[key].value) as number[],
                  );
                case ChartTypes.TRADES_BBO:
                  return this.getMaxDecimals([
                    point.points.BBO?.askPrice || 0,
                    point.points.BBO?.bidPrice || 0,
                    point.points.TRADES?.value || 0,
                  ] as number[]);
              }
            }),
          );
        }),
        distinctUntilChanged(),
        takeUntil(this.chartDestroy$),
      )
      .subscribe((maxDecimals) => this.maxDecimals$.next(maxDecimals));
  }

  private debugPointState(points: {time: number}[]) {
    const map = new Map();
    const times = points.map((p) => {
      const set = map.get(p.time) || [];
      set.push(p);
      map.set(p.time, set);
      return p.time;
    });
    const doubled = [];
    [...map.keys()].forEach((t) => {
      if (map.get(t).length > 1) {
        doubled.push({
          time: t ? new Date(t).toISOString() : t,
          points: map.get(t),
        });
      }
    });

    return {
      minTime: times.length ? new Date(Math.min(...times)).toISOString() : null,
      maxTime: times.length ? new Date(Math.max(...times)).toISOString() : null,
      doubled,
      pointsLength: times.length,
    };
  }

  private socketsSubscription() {
    return combineLatest([
      this.getActiveTab(),
      this.storageService
        .getData(['chartType', 'barsAggregation', 'pointInterval', 'levels'])
        .pipe(filter((storage) => !!storage?.data)),
    ]).pipe(
      distinctUntilChanged(equal),
      switchMap(([tab, storage]: [TabModel, DeltixChartStorage]) => {
        const startWatch = this.initEndOfStreamNotRounded;
        const params = {
          instrument: tab.symbol,
          chartType: storage.chartType,
          startTime: new Date(startWatch)?.toISOString(),
          pointInterval:
            storage.chartType === ChartTypes.BARS
              ? storage.barsAggregation?.toString()
              : storage.pointInterval?.toString(),
        };

        if (storage.levels && storage.chartType === ChartTypes.PRICES_L2) {
          params['levels'] = storage.levels.toString();
        }

        return this.wsService
          .watchObject<{lines: ChartRowLines}>(`/user/topic/charting/${tab.stream}`, params)
          .pipe(map((data) => ({data, startWatch, pointInterval: storage.pointInterval, storage})));
      }),
      concatMap(({data, startWatch, pointInterval, storage}) => {
        const points = this.convertLinesDataToEverChartData(data.lines, this.chartType);
        const times = points.map((p) => p.time);
        const toTime = times.length ? Math.max(...times) : startWatch;
        const lineEndTime =
          storage.chartType === ChartTypes.BARS ? toTime + storage.barsAggregation / 2 : toTime;

        return this.updateData(
          points,
          startWatch,
          toTime,
          this.actualInterval$.getValue(),
          pointInterval,
        ).pipe(
          map(() => points),
          tap(() => this.endOfStream$.next(lineEndTime)),
        );
      }),
    );
  }

  private tail(): number {
    const [startDate, endDate] = this.borders$.getValue();
    return Math.ceil(endDate - startDate);
  }

  private fillRanges(
    ranges: [number, number][],
    newStart: number,
    newEnd: number,
    newInterval: number,
  ): Observable<any> {
    if (!ranges.length) {
      return of(null);
    }

    let pointInterval =
      ((this.borders$.getValue()[1] - this.borders$.getValue()[0]) / this.width) * 2;
    const round = pointInterval <= 1000 ? 1 : 100;
    pointInterval = Math.ceil(pointInterval / round) * round;

    this.debugService.log(() => ({
      action: 'pointInterval',
      payload: {
        pointInterval,
        borders: this.borders$.getValue().map((t) => new Date(t).toISOString()),
        width: this.width,
      },
    }));

    return combineLatest(
      ranges.map(([start, end]) => this.getDots(start, end, pointInterval)),
    ).pipe(
      map((responses) => [].concat.apply([], responses)),
      switchMap((data: DeltixChartFormattedData[]) =>
        this.updateData(data, newStart, newEnd, newInterval, pointInterval),
      ),
    );
  }

  private updateData(
    data: DeltixChartFormattedData[],
    newStart: number,
    newEnd: number,
    newInterval: number,
    pointInterval: number,
    doUpdate = true,
  ): Observable<void> {
    return this.storageService
      .updateData((store) => {
        const sortRanges = (ranges) => ranges.sort((a, b) => (a[0] > b[0] ? 1 : -1));
        const knownRanges = (store?.knownRanges || []).sort((a, b) => (a[0] > b[0] ? 1 : -1));

        this.debugService.log(() => ({
          action: 'update known ranges',
          payload: {
            storage: knownRanges.map((r) => r.map((t) => new Date(t).toISOString())),
            newStart: new Date(newStart).toISOString(),
            newEnd: new Date(newEnd).toISOString(),
          },
        }));

        const intersects = knownRanges.filter((kr) => kr[1] >= newStart && kr[0] <= newEnd);
        const minIntersects = intersects[0] ? intersects[0][0] : newStart;
        const maxIntersects = intersects[intersects.length - 1]
          ? intersects[intersects.length - 1][1]
          : newEnd;
        const newRange: [number, number] = [
          Math.min(newStart, minIntersects),
          Math.max(newEnd, maxIntersects),
        ];
        let newKnownRanges = knownRanges.filter(
          ([start, end]) => !intersects.find((i) => i[0] === start && i[1] === end),
        );
        newKnownRanges.push(newRange);

        this.debugService.log(() => ({
          action: 'newKnownRanges',
          payload: newKnownRanges.map((r) => r.map((t) => new Date(t).toISOString())),
        }));

        let newData = store?.data ? store.data.concat(data) : data;
        const uniqueSet = new Map();
        newData.forEach((point) => uniqueSet.set(point.time, point));
        newData = [...uniqueSet.values()];

        this.debugService.log(() => ({
          action: 'new data',
          payload: this.debugPointState(newData),
        }));

        if (newData.length > 4500) {
          const cut = [
            this.borders$.getValue()[0] - this.tail(),
            this.borders$.getValue()[1] + this.tail(),
          ];
          newData = newData.filter((p) => p.time >= cut[0] && p.time <= cut[1]);
          newKnownRanges = newKnownRanges
            .filter((r) => r[1] >= cut[0] && r[0] <= cut[1])
            .map((r) => {
              const start = r[0] < cut[0] ? cut[0] : r[0];
              const end = r[1] > cut[1] ? cut[1] : r[1];
              return [start, end];
            });

          this.debugService.log(() => ({
            action: 'clear',
            payload: {
              cut: cut.map((t) => new Date(t).toISOString()),
              points: this.debugPointState(newData),
              newKnownRanges: newKnownRanges.map((r) => r.map((t) => new Date(t).toISOString())),
            },
          }));
        }

        this.debugService.log(() => ({
          action: 'update Store',
          payload: {
            data: this.debugPointState(newData),
            knownRanges: sortRanges(newKnownRanges).map((r) =>
              r.map((t) => new Date(t).toISOString()),
            ),
            interval: newInterval,
            barsAggregation: this.barsAggregation,
            levels: this.levels,
            chartType: this.chartType,
          },
        }));

        return {
          ...store,
          data: newData,
          knownRanges: sortRanges(newKnownRanges),
          interval: newInterval,
          pointInterval,
          barsAggregation: this.barsAggregation,
          levels: this.levels,
          chartType: this.chartType,
        };
      }, doUpdate)
      .pipe(mapTo(null));
  }

  private getActiveTab(): Observable<TabModel> {
    return this.appStore.pipe(select(getActiveTab), take(1));
  }

  private getDots(startTime, endTime, pointInterval): Observable<DeltixChartFormattedData[]> {
    return this.getActiveTab().pipe(
      take(1),
      switchMap((tab) => {
        if (tab.filter.chart_type === ChartTypes.BARS) {
          pointInterval = tab.filter.period.aggregation;
        }
        const params = {
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          pointInterval: pointInterval as string,
          symbols: tab.symbol,
          levels: tab.filter.levels?.toString(),
          space: tab.space,
          type: tab.filter.chart_type as string,
        };

        Object.keys(params).forEach((key) => {
          if (!params[key]) {
            delete params[key];
          }
        });
        this.debugService.log(() => ({
          action: 'http request',
          payload: params,
        }));
        this.loading$.next(this.loading$.getValue() + 1);

        return this.httpRequest(tab.stream, params).pipe(map((resp) => ({resp, tab, params})));
      }),
      map(({resp, tab, params}): DeltixChartFormattedData[] => {
        return this.convertLinesDataToEverChartData(resp[0].lines, tab.filter.chart_type).sort(
          (data1, data2) => data1.time - data2.time,
        );
      }),
      finalize(() => timer().subscribe(() => this.loading$.next(this.loading$.getValue() - 1))),
    );
  }

  private convertLinesDataToEverChartData(
    lines: ChartRowLines,
    chartType: ChartTypes,
  ): DeltixChartFormattedData[] {
    const POINTS_MAP = new Map<number, DeltixChartFormattedData>();
    Object.keys(lines).forEach((lineKey) => {
      const LINE = lines[lineKey];
      LINE.points.forEach((point) => {
        if (!POINTS_MAP.has(point.time)) {
          POINTS_MAP.set(point.time, {
            time: point.time,
            points: {},
          });
        }
        const POINTS_DATA = POINTS_MAP.get(point.time);
        if (POINTS_DATA) {
          switch (chartType) {
            case ChartTypes.BARS: {
              POINTS_DATA.points[lineKey] = {
                ...point,
                close: parseFloat(point.close as string),
                high: parseFloat(point.high as string),
                low: parseFloat(point.low as string),
                open: parseFloat(point.open as string),
                width: LINE.aggregationSizeMs,
              };
              break;
            }
            case ChartTypes.TRADES_BBO:
              if (lineKey !== 'TRADES') {
                const askPrice = parseFloat(point.askPrice as string),
                  bidPrice = parseFloat(point.bidPrice as string);
                POINTS_DATA.points[lineKey] = {
                  ...point,
                  askPrice: !isFinite(askPrice) ? null : askPrice,
                  bidPrice: !isFinite(bidPrice) ? null : bidPrice,
                };
                break;
              }
            // tslint:disable-next-line:no-switch-case-fall-through
            default:
              {
                const VAL = parseFloat(point.value as string);
                POINTS_DATA.points[lineKey] = {
                  ...point,
                  value: !isFinite(VAL) ? null : VAL,
                };
              }
              break;
          }
        }
      });
    });

    return Array.from(POINTS_MAP.values());
  }

  private correlationId(): Observable<string> {
    return this.httpClient.get('/correlationId') as Observable<string>;
  }

  private stopRequest(correlationId: string): Observable<void> {
    return this.httpClient
      .get('charting/dx/stopCharting', {params: {correlationId}})
      .pipe(mapTo(null));
  }

  private httpRequest(stream: string, params: {[index: string]: string}): Observable<ChartModel[]> {
    return new Observable<ChartModel[]>((source) => {
      let success = false;
      let currentCorrelationId = null;
      const subscription = this.correlationId()
        .pipe(
          switchMap((correlationId) => {
            currentCorrelationId = correlationId;
            return this.httpClient.get<ChartModel[]>(`charting/dx/${encodeURIComponent(stream)}`, {
              params: {...params, correlationId},
              headers: {customError: 'true'},
            });
          }),
        )
        .subscribe((response) => {
          success = true;
          source.next(response);
          source.complete();
        });

      return () => {
        subscription.unsubscribe();
        if (!success && currentCorrelationId) {
          timer()
            .pipe(switchMap(() => this.stopRequest(currentCorrelationId)))
            .subscribe();
        }
      };
    });
  }

  private getMaxDecimals(data: number[]): number {
    const filtered = data.filter(Boolean);
    if (!filtered.length) {
      return 0;
    }

    return Math.max(...filtered.map((num) => num.toString().split('.')[1]?.length || 0));
  }
}
