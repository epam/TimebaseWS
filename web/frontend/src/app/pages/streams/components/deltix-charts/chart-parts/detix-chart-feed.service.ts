import { HttpErrorResponse }     from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import {
  IEverChartFeed,
  IEverChartFeedHistoryOptions,
  IEverChartFeedOptions, ZOOM,
} from '@deltix/hd.components-everchart';
import { select, Store }                                                                             from '@ngrx/store';
import equal
                                                                                                     from 'fast-deep-equal';
import {
  BehaviorSubject,
  combineLatest,
  interval,
  Observable,
  of,
  Subject,
  Subscription,
  throwError,
  timer,
} from 'rxjs';
import {
  auditTime,
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  mapTo, publishReplay, refCount,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { WSService }          from '../../../../../core/services/ws.service';
import { AppState }           from '../../../../../core/store';
import { LinearChartService } from '../../../../../shared/services/linear-chart.service';
import { TabStorageService }  from '../../../../../shared/services/tab-storage.service';
import {
  barChartTypes,
  ChartModel,
  ChartRowLines,
  ChartTypes,
}                             from '../../../models/chart.model';
import {
  DeltixChartFormattedData,
  ZOOM_TIME,
}                             from '../../../models/deltix-chart.models';
import { TabModel }           from '../../../models/tab.model';
import { getActiveTab }      from '../../../store/streams-tabs/streams-tabs.selectors';
import { month }  from '../charts/units-in-ms';
import { ChartsHttpService } from './charts.http.service';
import { DeltixChartStorage } from './deltix-chart-storage';
import { SymbolsService } from 'src/app/shared/services/symbols.service';
import { ChartService } from 'src/app/shared/services/chart-service';
import { ChartPointModel } from '../../../models/chart.model';

@Injectable()
export class DeltixChartFeedService implements IEverChartFeed, OnDestroy {
  maxDecimals$ = new BehaviorSubject<number>(0);
  storage$: Observable<DeltixChartStorage>;
  
  private borders$ = new BehaviorSubject<[number, number]>([0, 0]);
  private chartDestroy$ = new Subject<void>();
  private storageService: TabStorageService<DeltixChartStorage>;
  private width: number;
  private actualInterval$ = new BehaviorSubject<number>(null);
  private barsAggregation: number;
  private levels: number;
  private ranges: [number, number][];
  private chartType: ChartTypes;
  private initEndOfStreamNotRounded: number;
  private loading$ = new BehaviorSubject<number>(0);
  private socketsFreshing$ = new BehaviorSubject(false);
  private requestFreshing$ = new BehaviorSubject(false);
  private socketSubscription?: Subscription;
  private httpError$ = new BehaviorSubject(null);
  private exchanges$ = new BehaviorSubject<Set<string>>(new Set());
  private noPoints$ = new BehaviorSubject<string[]>([]);
  private destroy$ = new Subject();
  private updates$ = new BehaviorSubject<{id: number, payload: any}>(null);
  private updated$ = new BehaviorSubject(0);
  private linearTimestamps: Set<number> = new Set();
  private source: string;
  private symbolList = {};
  private symbolsWithData: Set<string>;
  symbolExchanges: { [key: string]: Set<string> };
  symbolExchangesSubject = new Subject();
  private lastRequestedPoints: { [source: string]: DeltixChartFormattedData } = {};
  private range: { start: number, end: number } = { start: 0, end: 0 };
  private tabId: string;
  private tbId: string;
  private endOfStream$ = new BehaviorSubject<number>(0);
  currentScrollEnd$ = new BehaviorSubject<{ value: number, liveData: boolean}>({ value: 0, liveData: false });
  private savedData = {};
  
  constructor(
    private appStore: Store<AppState>,
    private wsService: WSService,
    private chartsHttpService: ChartsHttpService,
    private linearChartService: LinearChartService,
    private symbolService: SymbolsService,
    private chartService: ChartService
  ) {
    this.updates$.pipe(
      filter(Boolean),
      concatMap(({id, payload}) => payload().pipe(map(() => id))),
      tap(id => this.updated$.next(id as number)),
      takeUntil(this.destroy$),
    ).subscribe();

    this.appStore.pipe(
      select(getActiveTab),
      filter(tab => !!tab),
      distinctUntilChanged((t1, t2) => t1 && t2 && t1.id === t2.id),
      takeUntil(this.destroy$))
    .subscribe(tab => { this.tabId = tab.id; this.tbId = tab.tbId; });

    this.symbolList = this.chartService.getAllSavedSymbols() ?? {};
  }

  request(options: IEverChartFeedHistoryOptions): Observable<DeltixChartFormattedData[]> {
    this.zoomIntervalChange(options.interval);
    return this.getActiveTab().pipe(
      take(1),
      filter(tab => tab && !!tab.filter),
      map(tab => {
        return this.closePoints(
          new Date(tab.filter.from).getTime() - 60 * 1000,
          new Date(tab.filter.to).getTime() + 60 * 1000,
        );
      }),
    );
  }
  
  subscribe(options: IEverChartFeedOptions): Observable<DeltixChartFormattedData[]> {
    if (options.interval !== this.actualInterval$.getValue()) {
      this.requestFreshing$.next(true);
    }
    
    const exchanges = new Set<string>();

    return combineLatest([
      this.storage$,
      this.borders$,
      this.storageService.flow<DeltixChartStorage>('exchange').getData(['exchange'])
        .pipe(distinctUntilChanged((state1, state2) => state1?.exchange.id === state2?.exchange.id)),
      this.linearChartService.showLines().pipe(distinctUntilChanged(equal)),
    ]).pipe(
      filter(([state]) => !!state),
      map(([state, borders, exchangeState, lines]) => {
        const stateData = state.data ? state.data.filter(dataItem => !!dataItem) : [];

        const symbolExchanges = {};

        this.symbolsWithData = new Set();

        this.symbolList[this.tabId].forEach(symbol => {
          symbolExchanges[symbol] = new Set();

          stateData.forEach(item => {
            Object.entries(item.points).forEach(([symbolKey, points]) => {
              const emptyValues = Object.entries(points)
                .some(([key, value]) => !value || (barChartTypes.includes(this.chartType) && key === 'close' && value === 'NaN'));

              const keyAsArray = symbolKey.split('_');
              const symbolName = keyAsArray.slice(0, keyAsArray.length - 1).join('_');

              if (!!Object.keys(points).length && symbolName === symbol && !emptyValues) {
                this.symbolsWithData.add(symbol);
              }
              if (points['exchange'] && points['exchange'] !== 'null') {
                exchanges.add(points['exchange']);
                if (symbolKey.includes(symbol)) {
                  symbolExchanges[symbol].add(points['exchange']);
                }
              }
            });
          })
        });
        
        this.exchanges$.next(exchanges);
        this.symbolExchanges = symbolExchanges;
        this.symbolExchangesSubject.next(symbolExchanges);

        const definedExchange =
          exchangeState?.exchange?.id || (exchanges ? [...exchanges]?.[0] : null);
        return {storage: state, borders, exchange: definedExchange, lines: state.chartType === ChartTypes.LINEAR ? lines : null};
      }),
      map(({storage, borders, exchange, lines}) => {
        const storageData = storage?.data ? storage?.data.filter(dataItem => !!dataItem) : [];
        const showIds = lines?.map(l => this.linearChartService.linearId(l));
        const showLineIds = [];

        if (showIds) {
          this.symbolList[this.tabId].forEach(symbol => {
            showIds.forEach(lineId => showLineIds.push(`${symbol}_${lineId}`))
          })
        }

        const points = (storageData || []);
        if (points.length && this.chartType === ChartTypes.PRICE_LEVELS) {
          this.symbolList[this.tabId].forEach(symbol => this.finishL2Points(symbol, points, storage as DeltixChartStorage));
        }
  
        let resultPoints = [];
  
        if (!lines) {
          const [filterLeft, filterRight] = this.filterRange(borders, storage?.chartType, storage?.barsAggregation);
          resultPoints = points.filter(({time, points}) => {
            if (time < filterLeft || time > filterRight) {
              return false;
            }
      
            if (exchange && !Object.values(points).find((p) => (p['exchange'] === exchange) || !p.hasOwnProperty('exchange'))) {
              return false;
            }
      
            return true;
          });
        } else {
          const map = new Map();
          points.forEach(p => {
            const timePoints = {};
            showLineIds.forEach(lineId => {
              timePoints[lineId] = p.points[lineId];
            });
            map.set(p.time, timePoints);
            this.linearTimestamps.add(p.time);
          });
          [...this.linearTimestamps].forEach(time => {
            resultPoints.push({time, points: map.get(time) || {}});
          });
        }
        
        return resultPoints;
      }),
      tap(points => {
        const lastPoint = points[points.length - 1];
        if (lastPoint?.time > this.endOfStream$.getValue()) {
          this.endOfStream$.next(lastPoint.time);
          this.currentScrollEnd$.next( { value: lastPoint.time, liveData: false } );
        }
         
        const barOffset = this.barsAggregation && barChartTypes.includes(this.chartType) ? 0.98 * this.barsAggregation / 2 : 0;

        if (this.chartType === ChartTypes.LINEAR) {
          this.symbolsWithData = new Set();

          const symbolPointsTimestamps = {};
          points.forEach(item => Object.entries(item.points).forEach(([symbolKey, pointValue]: [string, ChartPointModel]) => {
            const keyAsArray = symbolKey.split('_');
            const symbolName = keyAsArray.slice(0, keyAsArray.length - 1).join('_');
            if (pointValue?.time) {
              if (!symbolPointsTimestamps[symbolName]) {
                symbolPointsTimestamps[symbolName] = new Set();
              }
              symbolPointsTimestamps[symbolName].add(pointValue.time);
            }
          }));

          this.symbolList[this.tabId].forEach((symbol: string) => {
            const allSymbolTimestamps = symbolPointsTimestamps[symbol] ? [ ...symbolPointsTimestamps[symbol] ] : [];
            const minTime = Math.min(...allSymbolTimestamps);
            const maxTime = Math.max(...allSymbolTimestamps);
            const allPointsBeforeRange = maxTime <= this.range?.start;
            const allPointsAfterRange = minTime >= this.range?.end;
            if (!allPointsBeforeRange && !allPointsAfterRange) {
              this.symbolsWithData.add(symbol);
            }
          })
          this.noPoints$.next(this.symbolList[this.tabId].filter((symbol: string) => !this.symbolsWithData.has(symbol)));
        } else {
          const pointsInRange = points
            .filter(point => point.time > this.range.start - barOffset && point.time < this.range.end + barOffset);

          if (!pointsInRange.length) {
            this.noPoints$.next(this.symbolList[this.tabId]);
          } else {
            this.symbolsWithData = new Set();
      
            this.symbolList[this.tabId].forEach((symbol: string) => {
      
              pointsInRange.forEach(item => {
                Object.entries(item.points).forEach(([symbolKey, points]) => {
                  const emptyValues = Object.entries(points ?? {})
                    .some(([key, value]) => {
                      return (!value && key !== 'exchange') || (barChartTypes.includes(this.chartType) && key === 'close' && value === 'NaN');
                  });
      
                  const keyAsArray = symbolKey.split('_');
                  const symbolName = keyAsArray.slice(0, keyAsArray.length - 1).join('_');
      
                  if (!!Object.keys(points ?? {}).length && symbolName === symbol && !emptyValues) {
                    this.symbolsWithData.add(symbol);
                  }
                });
              })
            });
            this.noPoints$.next(this.symbolList[this.tabId].filter(symbol => !this.symbolsWithData.has(symbol)));
          }
        }
      }),
      takeUntil(this.chartDestroy$),
      // Rerender to prevent get animated value bug
      // TODO: Remove on new charts version
      switchMap(points => interval(200).pipe(take(2), map(() => points))),
    );
  }
  
  onNoPoints() {
    return combineLatest([
      this.noPoints$,
      this.onLoading(),
    ]).pipe(
      map(([noPoints, loading]) => loading ? [] : noPoints),
      debounceTime(300),
    );
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
  
  onExchanges(): Observable<string[]> {
    return this.exchanges$.pipe(
      map((set) => [...set]),
      distinctUntilChanged(equal),
      debounceTime(0),
    );
  }
  
  zoomIntervalChange(interval: number): void {
    if (interval !== this.actualInterval$.getValue()) {
      this.socketSubscription?.unsubscribe();
      this.actualInterval$.next(interval);
    }
  }
  
  setWidth(width: number): void {
    this.width = width;
  }
  
  chartInit(
    start: number,
    end: number,
    barsAggregation: number,
    levels: number,
    chartType: ChartTypes,
    initEndOfStreamNotRounded: number,
    endOfStream: number,
    tabStorageService: TabStorageService<DeltixChartStorage>,
    source: string
  ) {
    this.storageService = tabStorageService;
    this.barsAggregation = barsAggregation;
    this.levels = levels;
    this.chartType = chartType;
    this.initEndOfStreamNotRounded = initEndOfStreamNotRounded;
    this.bordersChange(start, end);
    this.endOfStream$.next(endOfStream);
    this.currentScrollEnd$.next({ value: endOfStream, liveData: false });
    this.requestFreshing$.next(true);
    this.socketSubscription?.unsubscribe();
    this.socketSubscription = null;
  
    this.storage$ = combineLatest([
      this.storageService.getData(['savedSchema']),
      this.socketsFreshing$.pipe(distinctUntilChanged()),
      this.requestFreshing$.pipe(distinctUntilChanged()),
    ]).pipe(
      concatMap(([storage, waitSockets, waitRequest]) => {
        if (waitSockets || waitRequest) {
          return of(null);
        }
      
        if (!storage?.savedSchema?.length) {
          return of({groups: [[]], storage});
        }

        return combineLatest(storage.savedSchema.map(entry => this.storageService.flow(`data-${entry.key}-${source}`).getData().pipe(take(1))))
          .pipe(map(groups => ({groups: groups, storage})), take(1));
      }),
      map((groupsAndStorage) => {
        if (!groupsAndStorage) {
          return null;
        }
      
        const data = [].concat.apply([], groupsAndStorage.groups);
        return ({...groupsAndStorage.storage, data});
      }),
      takeUntil(this.chartDestroy$),
      publishReplay(1),
      refCount(),
    );
  }
  
  runChart(source: string = 'L2') {
    this.borders$
      .pipe(
        distinctUntilChanged(equal),
        filter(([left, right]) => left !== 0 || right !== 0),
      )
      .pipe(
        auditTime(300),
        switchMap((borders) => {
          this.requestFreshing$.next(true);
          return this.fillStorage(borders, this.chartType, this.barsAggregation, this.levels, source).pipe(take(1));
        }),
        takeUntil(this.chartDestroy$),
      )
      .subscribe((freshStorage) => {
        this.requestFreshing$.next(false);
        this.socketsFreshing$.next(false);
        if (freshStorage || !this.socketSubscription) {
          this.socketSubscription?.unsubscribe();
          this.socketSubscription = this.socketsSubscription()
            .pipe(takeUntil(this.chartDestroy$))
            .subscribe();
        }
      });
    
    this.subscribeMaxDecimals(this.storageService);
  }
  
  fillStorage(borders, chartType, barsAggregation, levels, source: string): Observable<boolean> {
    return this.storageService.getData().pipe(
      take(1),
      switchMap(() => this.actualInterval$),
      filter((i) => i !== null),
      take(1),
      map((actualInterval) => [borders, actualInterval]),
      map(([borders, actualInterval]: [[number, number], number]) => {
        const [startDate, endDate] = borders;
        return [startDate, endDate, this.tail(borders), actualInterval, borders];
      }),
      concatMap(
        ([startDate, endDate, tail, actualInterval, borders]: [number, number, number, number, [number, number]]) => {
          const storageData = this.storageService.snapShot;
          let endOfStream = this.endOfStream$.getValue();
          if (barChartTypes.includes(chartType)) {
            endOfStream -= barsAggregation / 2;
          }
          
          const needEnd = Math.min(endDate + tail, endOfStream);
          const needStart = Math.min(startDate - tail, needEnd);
          let subRanges;
          
          const intervalChanged =
            (storageData?.chartType === chartType && barChartTypes.includes(chartType))
              ? false
              : (actualInterval !== storageData?.interval && storageData?.interval !== undefined);
          
          const freshStorage =
            !storageData ||
            intervalChanged ||
            storageData.barsAggregation !== barsAggregation ||
            storageData.levels !== levels ||
            storageData.chartType !== chartType;
          
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
          } else {
            subRanges = [[needStart, needEnd]];
          }
          
          const fresh$ = this.storageService.getData().pipe(
            take(1),
            tap(storage => {

              const keys = storage?.savedSchema?.map(e => e.key);
              if (keys?.length) {
                combineLatest(keys.map(k => this.storageService.removeFlow(`data-${k}-L1`))).pipe(take(1)).subscribe();
                combineLatest(keys.map(k => this.storageService.removeFlow(`data-${k}-L2`))).pipe(take(1)).subscribe();
              }
            }),
            concatMap(() => this.queueUpdate(() => this.storageService.updateData(() => ({})))),
          );
          
          const clear$ = freshStorage
            ? fresh$
            : of(null);
          
          const pointInterval = this.calculatePointInterval(
            borders[0],
            borders[1],
            this.width,
          );
          const sourceChanged = this.source && this.source !== source;
          const symbolListExtended = this.symbolService.symbolList[this.tabId]?.filter(symbol => {
            return !this.symbolService.lastLoadedSymbolList[this.tabId]?.includes(symbol);
            }).length;
          if (sourceChanged || symbolListExtended) {
            subRanges.push([needStart, needEnd]);
          }

          const jointRanges: [number, number][] = [];

          subRanges.forEach((range: [number, number], index: number) => {

            const sameValueRangeIndex = subRanges.findIndex((r: [number, number]) => r[0] === range[0] && r[1] === range[1]);
            const matchedEndIndex = subRanges.findIndex((r: [number, number]) => r[1] === range[0]);
            const matchedStartIndex = subRanges.findIndex((r: [number, number]) => r[0] === range[1]);
            const rangeWithSameEndIndex = subRanges.findIndex((r: [number, number]) => r[1] === range[1] && r[0] !== range[0]);

            if (sameValueRangeIndex !== index) {
              subRanges.splice(sameValueRangeIndex, 1);
            } else if (matchedEndIndex !== -1) {
              jointRanges.push([subRanges[matchedEndIndex][0], range[1]]);
              subRanges.splice(matchedEndIndex, 1);
            } else if (matchedStartIndex !== -1) {
              jointRanges.push([range[0], subRanges[matchedStartIndex][1]]);
              subRanges.splice(matchedStartIndex, 1);
            } else if (rangeWithSameEndIndex !== -1) {
              jointRanges.push([
                range[0] < subRanges[rangeWithSameEndIndex][0] ? range[0] : subRanges[rangeWithSameEndIndex][0], 
                range[1]]);
              subRanges.splice(rangeWithSameEndIndex, 1);
            } else {
              jointRanges.push(range);
            }
          })

          const resultRanges = jointRanges.map(range => {
            if (range[1] - range[0] < 10000) {
              return [range[0] - 5000, range[1] + 5000];
            } else {
              return range;
            }
          })

          return clear$.pipe(
            concatMap(() =>
              this.fillRanges(
                resultRanges as [number, number][],
                needStart,
                needEnd,
                actualInterval,
                pointInterval,
                source
              ),
            ),
            map(() => freshStorage),
          );
        },
      ),
    );
  }
  
  chartDestroy() {
    this.chartDestroy$.next();
    this.borders$.next([0, 0]);
    this.actualInterval$.next(null);
  }
  
  onLoading(): Observable<boolean> {
    return this.loading$.pipe(map((processes) => processes > 0));
  }
  
  increaseLoading() {
    this.loading$.next(this.loading$.getValue() + 1);
  }
  
  decreaseLoading() {
    this.loading$.next(Math.max(this.loading$.getValue() - 1, 0));
  }
  
  resetHttpError() {
    this.httpError$.next(null);
  }
  
  onHttpError(): Observable<HttpErrorResponse> {
    return this.httpError$.asObservable();
  }
  
  requestParams(tab: TabModel, startTime, endTime, pointInterval): { [index: string]: string } {
    if (!startTime) {
      return;
    }
    const params = {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      pointInterval: pointInterval,
      symbols: tab.symbol.split(',')[0],
      levels: tab.filter.levels?.toString() ?? '10',
      space: tab.space,
      type: tab.filter.chart_type as string,
      source: tab.filter?.source?.[0]
    };
    
    Object.keys(params).forEach((key) => {
      if (!params[key]) {
        delete params[key];
      }
    });
    
    return params;
  }
  
  calculatePointInterval(start: number, end: number, width: number) {
    const pointInterval = ((end - start) / width) * 2;
    const round = pointInterval <= 1000 ? 1 : 100;
    return Math.ceil(pointInterval / round) * round;
  }
  
  requestData(stream: string, params: { [index: string]: string | string[] }): Observable<ChartModel[]> {
    return new Observable<ChartModel[]>((source) => {
      let success = false;
      let currentCorrelationId = null;
      const subscription = this.chartsHttpService.correlationId()
        .pipe(
          switchMap((correlationId) => {
            currentCorrelationId = correlationId;
            return this.chartsHttpService.data(stream, params, correlationId, this.tbId);
          }),
        )
        .subscribe(
          (response) => {
            success = true;
            source.next(response);
            source.complete();
          },
          (error) => {
            source.error(error);
            source.complete();
          },
        );
      
      return () => {
        subscription.unsubscribe();
        if (!success && currentCorrelationId) {
          timer()
            .pipe(switchMap(() => this.chartsHttpService.stopRequest(currentCorrelationId)))
            .subscribe();
        }
      };
    });
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
                case ChartTypes.BARS_ASK:
                case ChartTypes.BARS_BID:
                case ChartTypes.BARS_TRADES:
                  const params = point.points.BARS;
                  return this.getMaxDecimals([
                    params.low,
                    params.high,
                    params.open,
                    params.close,
                  ] as number[]);
                case ChartTypes.PRICE_LEVELS:
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
  
  private socketsSubscription() {
    return combineLatest([
      this.getActiveTab(),
      this.storageService
        .getData(['chartType', 'barsAggregation', 'pointInterval', 'levels'])
        .pipe(filter((storage) => !!storage?.savedSchema)),
    ]).pipe(
      distinctUntilChanged(equal),
      switchMap(([tab, storage]: [TabModel, DeltixChartStorage]) => {
        const startWatch = this.initEndOfStreamNotRounded;
        this.source = tab?.filter.source?.[0];
        const params = { 
          source: this.source,
          instrument: JSON.stringify(this.symbolList[tab.id]),
          chartType: storage.chartType,
          startTime: new Date(startWatch)?.toISOString(),
          pointInterval: (barChartTypes.includes(storage.chartType)
            ? storage.barsAggregation
            : storage.pointInterval * this.symbolList[tab.id]?.length) + '',
        };
        
        if (storage.levels && storage.chartType === ChartTypes.PRICE_LEVELS) {
          params['levels'] = storage.levels.toString();
        }
        if (this.tbId) {
          params['tbId'] = this.tbId;
        }
        this.increaseLoading();
        setTimeout(() => this.decreaseLoading(), 2000);

        return this.wsService
          .watchObject<{ lines: ChartRowLines }>(`/user/topic/charting/${tab.stream}`, params)
          .pipe(map((data) => ({data, startWatch, pointInterval: storage.pointInterval, storage})));
      }),
      concatMap(({data, startWatch, pointInterval, storage}) => {
        this.decreaseLoading();
        const [filterLeft, filterRight] = this.filterRange(this.borders$.getValue(), storage?.chartType, storage?.barsAggregation);
        const points = this.convertLinesDataToEverChartData(data.lines, this.chartType, true);
        const times = points.map((p) => p.time);
        const toTime = times.length ? Math.max(...times) : startWatch;
        const lineEndTime = barChartTypes.includes(storage.chartType)
          ? toTime + storage.barsAggregation / 2
          : toTime;
        
        this.socketsFreshing$.next(true);
       
        return this.updateDataQueue(
          points.filter(p => p.time >= filterLeft && p.time <= filterRight),
          startWatch,
          Math.min(filterRight, toTime),
          this.actualInterval$.getValue(),
          pointInterval,
          this.source,
          true
        ).pipe(
          map(() => points),
          tap(() => {
            this.socketsFreshing$.next(false);
            this.endOfStream$.next(lineEndTime);
            this.currentScrollEnd$.next( { value: lineEndTime, liveData: true })
          }),
        );
      }),
    );
  }
  
  private filterRange(borders, chartType, barsAggregation) {
    const [left, right] = borders;
    const barSize = barChartTypes.includes(chartType) ? barsAggregation : 0;
    const tail = Math.max(60 * 1000, barSize);
    return [left - tail, right + tail];
  }
  
  private tail(borders = null): number {
    const [startDate, endDate] = borders || this.borders$.getValue();
    return Math.floor(Math.ceil(endDate - startDate) / 4);
  }
  
  private fillRanges(
    ranges: [number, number][],
    newStart: number,
    newEnd: number,
    newInterval: number,
    pointInterval: number,
    source: string
  ): Observable<any> {
    this.ranges = ranges;
    if (!this.ranges?.length ) {
      return this.updateDataQueue([], newStart, newEnd, newInterval, pointInterval, source, false);
    } else {
      return combineLatest(
        this.ranges.map(([start, end]) => this.getDots(start, end, pointInterval, source))
      ).pipe(
        tap(() => this.symbolService.lastLoadedSymbolList[this.tabId] = [...this.symbolList[this.tabId]]),
        map(responses => [].concat.apply([], responses)),
        concatMap((data: DeltixChartFormattedData[]) => this.updateDataQueue(data, newStart, newEnd, newInterval, pointInterval, source, false)),
      );
    }
  }
  
  private getDots(startTime, endTime, pointInterval, source: string ): Observable<DeltixChartFormattedData[]> {
    return this.getActiveTab().pipe(
      take(1),
      filter(tab => !!tab),
      switchMap((tab) => {
        if (barChartTypes.includes(tab.filter.chart_type)) {
          pointInterval = tab.filter.period?.aggregation;
        } else {
          pointInterval *= this.symbolList[tab.id].length;
        }
        const params = {
          ...this.requestParams(tab, startTime, endTime, pointInterval),
          symbols: this.symbolList[tab.id],
        };
        
        this.increaseLoading();
        
        return this.requestData(tab.stream, params).pipe(map((resp) => ({resp, tab, params})));
      }),
      map(({resp, tab, params}): DeltixChartFormattedData[] => {
        this.chartType = tab.filter.chart_type;
        return this.convertLinesDataToEverChartData(resp[0].lines, tab.filter.chart_type, false);
      }),
      tap(data => {
        if (this.chartType === ChartTypes.PRICE_LEVELS) {
          const lastItems = data.slice(-5);
          lastItems.forEach(item => {
            if (this.lastRequestedPoints[source]) {
              this.lastRequestedPoints[source] = { ...this.lastRequestedPoints[source], ...item };
            } else {
              this.lastRequestedPoints[source] = item;
            }
          })
        }
      }),
      tap(() => this.httpError$.next(null)),
      catchError((error) => {
        this.httpError$.next(error);
        return throwError(error);
      }),
      finalize(() => timer().subscribe(() => this.decreaseLoading())),
    );
  }
  
  private updateDataQueue(data: DeltixChartFormattedData[],
                          newStart: number,
                          newEnd: number,
                          newInterval: number,
                          pointInterval: number,
                          source: string,
                          liveData: boolean): Observable<void> {
    return this.queueUpdate(() => this.updateData(data, newStart, newEnd, newInterval, pointInterval, source, liveData));
  }
  
  private queueUpdate(payload): Observable<void> {
    const id = (this.updates$.value?.id || 0) + 1;
    const return$ = this.updated$.pipe(filter(updatedId => id === updatedId), take(1), mapTo(null));
    this.updates$.next({id, payload});
    return return$;
  }
  
  private updateData(
    data: DeltixChartFormattedData[],
    newStart: number,
    newEnd: number,
    newInterval: number,
    pointInterval: number,
    source: string,
    liveData: boolean
  ): Observable<void> {
    
    return this.storageService.getData().pipe(
      take(1),
      concatMap((store) => {
        if (barChartTypes.includes(this.chartType)) {
          newInterval = 0;
        }
        
        let newKnownRanges = this.getNewKnownRanges(store?.knownRanges || [], newStart, newEnd);
        let savedSchema = [...store?.savedSchema || []].filter(item => item.key.endsWith(`-${store.interval}`));
        const keysToRemove = [...store?.savedSchema || []].map(item => item.key).filter(key => !key.endsWith(`-${store.interval}`));
        if (savedSchema.length > 30) {
          const step = this.getGroupDataStep(newInterval);

          const cut = [
            this.borders$.getValue()[0] - this.tail(),
            this.borders$.getValue()[1] + this.tail(),
          ];

          const left = Math.floor(cut[0] / step);
          const right = Math.ceil(cut[1] / step);

          savedSchema = savedSchema.filter(entry => {
            const entryIndex = Number(entry.key.split('-')[0]);
            if (entryIndex >= left && entryIndex <= right) {
              return true;
            }

            keysToRemove.push(entry.key);
          });

          newKnownRanges = newKnownRanges
            .filter((r) => r[1] >= cut[0] && r[0] <= cut[1])
            .map((r) => {
              const start = r[0] < cut[0] ? cut[0] : r[0];
              const end = r[1] > cut[1] ? cut[1] : r[1];
              return [start, end];
            });
        }

        const removeFlows$ = keysToRemove.length ? 
          combineLatest([
            ...keysToRemove.map(key => this.storageService.removeFlow(`data-${key}-L1`)),
            ...keysToRemove.map(key => this.storageService.removeFlow(`data-${key}-L2`))
          ]) : of(null);
        
        const groups = this.groupData(data, newInterval, keysToRemove, liveData);
        const groupKeys = Object.keys(groups);

        if (barChartTypes.includes(this.chartType)) {
          this.savedData[this.tabId] = { ...groups };
        }
        
        const dataSaveFlows$ = groupKeys.map(index => {
          let saveData: DeltixChartFormattedData[];
          if (barChartTypes.includes(this.chartType) && (liveData || !data.length) && groups[index].length < 22) {
            const storageData = groups[index]
              .reduce((acc, item, index) => {
                return [
                  ...acc,
                  { ...item, points: { ...(acc[index - 1]?.points ?? []), ...item.points } }
                ]
              }, []);
              saveData = storageData.length > data.length + 2 ? storageData.slice(-(data.length + 2)) : storageData;
          } else {
            saveData = groups[index];
          }

            return this.storageService.flow<DeltixChartFormattedData[]>(`data-${index}-${source}`)
              .updateData(storage => {
                let dataWithStorage;
                if (this.chartType === ChartTypes.PRICE_LEVELS && liveData && saveData.length < 30) {
                  if (this.lastRequestedPoints[source]) {
                    const tradesKeys = Object.keys(this.lastRequestedPoints[source].points).filter(key => key.includes('TRADES'));
                    tradesKeys.forEach(key => delete this.lastRequestedPoints[source].points[key]);
                  }

                  dataWithStorage = [];

                  dataWithStorage[0] = {
                    ...saveData[0],
                    points: {...(this.lastRequestedPoints[source]?.points ? 
                      this.updateL2PointsTime(this.lastRequestedPoints[source], saveData[0].time) : {}), 
                      ...saveData[0].points }
                  };

                  for (let i = 1; i < saveData.length; i += 1) {
                    dataWithStorage[i] = {
                      ...saveData[i],
                      points: {...(dataWithStorage[i - 1].points ? 
                        this.updateL2PointsTime(dataWithStorage[i - 1], saveData[i].time) : {}), 
                        ...saveData[i].points }
                    };
                  };

                  saveData.forEach(item => {
                    this.lastRequestedPoints[source] = {
                      ...(this.lastRequestedPoints[source] ?? {}),
                      time: item.time,
                      points: {
                        ...(this.lastRequestedPoints[source]?.points ?? {}),
                        ...item.points
                      }
                    };
                  })
                } else {
                  dataWithStorage = saveData;
                }
                 
                const newData = storage ? storage.concat(dataWithStorage) : dataWithStorage;

                const uniqueSet = new Map();
                newData.forEach((point) => {
                  uniqueSet.set(`${point.time}-${point.exchange}`, point);
                });
                return [...uniqueSet.values()];
              });
        });
        
        groupKeys.forEach(key => {
          const existing = savedSchema.find(s => s.key === key);
          if (existing) {
            existing.unique++;
          } else {
            savedSchema.push({key, unique: 0});
          }
        });
        
        return removeFlows$.pipe(
          concatMap(() => dataSaveFlows$.length ? combineLatest(dataSaveFlows$) : of(null)),
          map(() => ({
            ...store,
            savedSchema,
            knownRanges: newKnownRanges.sort((a, b) => (a[0] > b[0] ? 1 : -1)),
            interval: newInterval,
            pointInterval,
            barsAggregation: this.barsAggregation,
            levels: this.levels,
            chartType: this.chartType,
            newStart,
            newEnd,
          })),
        );
        
      }),
      concatMap(update => {
        return this.storageService.save(update);
      }),
      mapTo(null),
      take(1),
    );
  }
  
  private groupData(
    data: DeltixChartFormattedData[], 
    interval: number, 
    keysToRemove: string[],
    liveData: boolean): { [index: string]: DeltixChartFormattedData[] } {
    const step = this.getGroupDataStep(interval);
    const groups = barChartTypes.includes(this.chartType) && (liveData || !data.length) ? (this.savedData?.[this.tabId] ?? {}) : {};
    data.forEach(entry => {
      const index = `${Math.floor(entry.time / step)}-${interval}`;
      if (keysToRemove.includes(index.toString())) {
        return;
      }
      const itemNumber = data.length > 20 ? data.length : 20;
      
      groups[index] = groups[index]?.slice(-itemNumber) || [];
      groups[index].push(entry);
    });
    
    return groups;
  }
  
  private getGroupDataStep(interval: number): number {
    return (ZOOM_TIME[ZOOM.zoom[interval]] / 10) || month;
  }
  
  private getNewKnownRanges(storageKnownRanges: [number, number][], newStart: number, newEnd: number): [number, number][] {
    const knownRanges = storageKnownRanges.sort((a, b) => (a[0] > b[0] ? 1 : -1));
    const intersects = knownRanges.filter((kr) => kr[1] >= newStart && kr[0] <= newEnd);
    const minIntersects = intersects[0] ? intersects[0][0] : newStart;
    const maxIntersects = intersects[intersects.length - 1]
      ? intersects[intersects.length - 1][1]
      : newEnd;
    const newRange: [number, number] = [
      Math.min(newStart, minIntersects),
      Math.max(newEnd, maxIntersects),
    ];
    const newKnownRanges = knownRanges.filter(
      ([start, end]) => !intersects.find((i) => i[0] === start && i[1] === end),
    );
    newKnownRanges.push(newRange);
    return newKnownRanges;
  }
  
  private getActiveTab(): Observable<TabModel> {
    return this.appStore.pipe(select(getActiveTab), take(1));
  }
  
  private convertLinesDataToEverChartData(
    lines: ChartRowLines,
    chartType: ChartTypes,
    liveData: boolean
  ): DeltixChartFormattedData[] {
    const POINTS_MAP = new Map<string, DeltixChartFormattedData>();
    Object.keys(lines).forEach((lineKey) => {
      const LINE = lines[lineKey];
      LINE.points.forEach((point) => {
        const key = `${point.time}-${point.exchange}`;
        if (!POINTS_MAP.has(key)) {
          POINTS_MAP.set(key, {
            time: point.time,
            exchange: point.exchange,
            points: {},
          });
        }
        const POINTS_DATA = POINTS_MAP.get(key);
        if (POINTS_DATA) {
          switch (chartType) {
            case ChartTypes.BARS:
            case ChartTypes.BARS_BID:
            case ChartTypes.BARS_ASK:
            case ChartTypes.BARS_TRADES: {
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
            default: {
              const VAL = parseFloat(point.value as string);
              POINTS_DATA.points[lineKey] = {
                ...point,
                value: isNaN(VAL) ? NaN : isFinite(VAL) ? VAL : null,
              };
            }
              break;
          }
        }
      });
    });

    const resultPoints = Array.from(POINTS_MAP.values()).sort((p1, p2) => p1.time < p2.time ? -1 : 1);

    if (chartType === ChartTypes.LINEAR && resultPoints.length >= 5) {

      let allPoints = [];
      resultPoints.forEach(item => {
        allPoints = [
          ...allPoints,
          ...Object.entries(item?.points ?? {})
        ]
      })

      const pointsBySymbol = allPoints.reduce((acc, [key, value]) => {
        const symbolName = key.split('_')[0];
        if (acc[symbolName]) {
          acc[symbolName].push([key, value]);
        } else {
          acc[symbolName] = [[key, value]];
        }
        return acc;
      }, {});

      Object.entries(pointsBySymbol).forEach(([key, values]: [string, [string, { time: number, value: number }]]) => {
        const keyName = `${this.tabId}_${key}`;

        if (!this.chartService.upperPadLineList[keyName] && !this.chartService.lowerPadLineList[keyName]) {
          const midValue = values.map(v => v[1].value).reduce((acc, value) => isNaN(value) ? acc : acc + value, 0) / values.length;

          const upperPadLineSet = new Set<string>();
          const lowerPadLineSet = new Set<string>();
            
          const highValues = values.filter(value => value[1].value >= midValue);
          const lowValues = values.filter(value => value[1].value < midValue);
  
          highValues.map(value => value[0].split('_')[1].match(/\[(.*?)\]/)?.[1])
            .forEach(lineName => upperPadLineSet.add(lineName));
  
          lowValues.map(value => value[0].split('_')[1].match(/\[(.*?)\]/)?.[1])
            .forEach(lineName => lowerPadLineSet.add(lineName));

          this.chartService.upperPadLineList[keyName] = Array.from(upperPadLineSet);
          this.chartService.lowerPadLineList[keyName] = Array.from(lowerPadLineSet);

          this.chartService.savePadLines();
        }
      })
    }

    const lastPoint = resultPoints[resultPoints.length - 1];
    if (lastPoint?.time > this.currentScrollEnd$.getValue().value) {
      this.currentScrollEnd$.next({ value: lastPoint.time, liveData });
    }

    return chartType === ChartTypes.PRICE_LEVELS ? this.completeL2PointsWitRange(resultPoints) : resultPoints;
  }
  
  private getMaxDecimals(data: number[]): number {
    const filtered = data.filter(Boolean);
    if (!filtered.length) {
      return 0;
    }
    
    return Math.max(...filtered.map((num) => num.toString().split('.')[1]?.length || 0));
  }
  
  private finishL2Points(symbol: string, points: DeltixChartFormattedData[], storage: DeltixChartStorage) {
    let firstKeyIndex = 0;
    for (let i = points.length - 1; i >= 0; i--) {
      const keys = Object.keys(points[i].points);
      if (keys.find(key => key.includes('ASK') || key.includes('BID'))) {
        firstKeyIndex = i;
        break;
      }
    }
    
    const lastValues = {};
    const lastPoint = points[points.length - 1];
    for (let level = 0; level <= this.levels; level++) {
      ['ASK', 'BID'].forEach(type => {
        const key = `${symbol}_${type}[${level}]`;
        for (let pointsI = firstKeyIndex; pointsI >= 0; pointsI--) {
          if (points[pointsI].points[key]) {
            lastValues[key] = {time: lastPoint.time, value: Number(points[pointsI].points[key].value)};
            break;
          }
        }
      });
    }
    
    lastPoint.points = {...lastValues, ...lastPoint.points};
  }

  private completeL2PointsWitRange(resultPoints: DeltixChartFormattedData[]) {
    let itemBeforeRangeStartIndex: number,
        itemAfterRangeEndIndex: number;
    for (let i = resultPoints.length - 1; i >= 0; i--) {
      if (resultPoints[i].time > this.range?.end) {
        itemAfterRangeEndIndex = i;
      }
      if (resultPoints[i].time < this.range?.start) {
        itemBeforeRangeStartIndex = i;
        break;
      }
    }

    if (typeof itemBeforeRangeStartIndex === 'number') {
      let previousPoints = {};
      for (let i = 0; i <= itemBeforeRangeStartIndex; i++) {
        previousPoints = {
          ...previousPoints,
          ...resultPoints[i].points,
        }
      }

      const newItem = {
        ...resultPoints[itemBeforeRangeStartIndex],
        time: this.range.start,
        points: Object.fromEntries(
          Object.entries(previousPoints)
            .filter(([key]) => !key.includes('TRADES'))
            .map(([key, value]: [string, { time: number, value: number }]) => {
              return [ key, { ...value, time: this.range.start } ];
            })
        ) 
      };
      resultPoints.splice(itemBeforeRangeStartIndex + 1, 0, newItem);
    }

    if (itemAfterRangeEndIndex) {
      let afterPoints = {};
      for (let i = resultPoints.length - 1; i >= itemAfterRangeEndIndex; i--) {
        afterPoints = {
          ...afterPoints,
          ...resultPoints[i].points,
        }
      }

      const newItem = {
        ...resultPoints[itemAfterRangeEndIndex],
        time: this.range.end,
        points: Object.fromEntries(
          Object.entries(afterPoints)
            .filter(([key]) => !key.includes('TRADES'))
            .map(([key, value]: [string, { time: number, value: number }]) => {
              return [ key, { ...value, time: this.range.end } ];
            })
        ) 
      };
      resultPoints.splice(itemAfterRangeEndIndex, 0, newItem);
    }
    return resultPoints;
  }
  
  private closePoints(from: number, to: number) {
    return [
      {time: from, points: {}},
      {time: to, points: {}},
    ];
  }

  setSymbolList(symbolList: string[]) {
    this.symbolList[this.tabId] = symbolList;
    this.symbolService.symbolList[this.tabId] = symbolList;
  }

  updateRange(startTime: number, endTime: number) {
    this.range = {
      start: startTime,
      end: endTime
    }
  }

  private updateL2PointsTime(savedPoints: DeltixChartFormattedData, newTime: number) {
    return Object.fromEntries(
      Object.entries(savedPoints?.points).map(point => [point[0], { ...point[1], time: newTime}]))
  }
  
  ngOnDestroy(): void {
    this.chartDestroy();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
