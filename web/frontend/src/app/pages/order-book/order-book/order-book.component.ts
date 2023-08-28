import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
}                                      from '@angular/core';
import { DepthChartEmbeddableKernel }  from '@deltix/hd.components-depth-chart';
import { ContainerBuilder }            from '@deltix/hd.components-di';
import {
  AbstractEmbeddableKernel,
  embeddableAppUpdatePositionAction,
  MultiAppFacade,
}                                      from '@deltix/hd.components-multi-app';
import { updateParametersAction }      from '@deltix/hd.components-depth-chart-common';
import { OrderBook }                   from '@deltix/hd.components-order-book';
import { IL2Package }                  from '@deltix/hd.components-order-book/lib/l2';
import {
  MARKET_PRICE_USER_EXCHANGE,
  OrderGridEmbeddableKernel,
}                                      from '@deltix/hd.components-order-grid';
import { StorageMap }                  from '@ngx-pwa/local-storage';
import equal                           from 'fast-deep-equal/es6';
import {
  BehaviorSubject,
  combineLatest,
  merge,
  Observable, of,
  ReplaySubject,
  Subject,
}                                      from 'rxjs';
import {
  bufferTime, concatMap,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  take,
  takeUntil,
  tap,
}                                      from 'rxjs/operators';
import { WSService }                   from '../../../core/services/ws.service';
import { dateToTimezone, formatHDate } from '../../../shared/locale.timezone';
import { GlobalFiltersService }        from '../../../shared/services/global-filters.service';
import { ResizeObserveService }        from '../../../shared/services/resize-observe.service';
import { SymbolsService }              from '../../../shared/services/symbols.service';
import { OrderBookIdService }          from '../order-book-id.service';

export enum EResourceType {
  image = 'image',
  font = 'font',
  bitmap = 'bitmap',
}

export interface IFormattedNumber {
  integerPart: string;
  fractionalPart: string;
  decimalSeparator: string;
}

export enum EOrientations {
  price = 'price',
  quantity = 'quantity',
}

export type IFormat = (numberToFormat: string) => IFormattedNumber;
MARKET_PRICE_USER_EXCHANGE[2] = 0.1;
MARKET_PRICE_USER_EXCHANGE[3] = 0.2;

MARKET_PRICE_USER_EXCHANGE[0] = MARKET_PRICE_USER_EXCHANGE[1] =
  (1 - MARKET_PRICE_USER_EXCHANGE[2] - MARKET_PRICE_USER_EXCHANGE[3]) / 2;

export const defaultFormatFunction: IFormat = (numberToFormat: string) => {
  const splitted = numberToFormat.split('.');
  const integerPart = splitted[0];
  const fractionalPart = splitted[1] || '';
  
  return {
    integerPart,
    fractionalPart,
    decimalSeparator: fractionalPart ? '.' : '',
  };
};

@Component({
  selector: 'app-order-book',
  templateUrl: 'order-book.component.html',
  styleUrls: ['./order-book.component.scss'],
})
export class OrderBookComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('container') private container: ElementRef;
  
  @Input() symbol: string;
  @Input() streams: string[];
  @Input() exchanges: string[];
  @Input() orientation: EOrientations = EOrientations.price;
  @Input() hiddenExchanges: string[] = [];
  @Input() feed$: Observable<IL2Package>;
  @Input() inDepthChart = true;
  @Input() bookWidth = 500;
  @Input() padding = 30;
  @Input() showLastTime = false;
  
  @Output() ready = new EventEmitter<void>();
  @Output() readyWithData = new EventEmitter<void>();
  @Output() destroy = new EventEmitter<void>();
  @Output() exchangesChanged = new EventEmitter<string[]>();
  @Output() precisionError = new EventEmitter<boolean>();
  @Output() orientationChange = new EventEmitter<EOrientations>();
  @Output() reRun = new EventEmitter<void>();
  
  height: number;
  width: number;
  initialized = false;
  headerHeight = 30;
  headerPercents = MARKET_PRICE_USER_EXCHANGE.map((v) => v * 100);
  orientationDropdownOpen = false;
  orientations = [EOrientations.price, EOrientations.quantity];
  lastMessageTime$: Observable<string>;
  lastTimeHeight = 30;
  
  private destroy$ = new ReplaySubject(1);
  private facade: MultiAppFacade;
  private bookId: string;
  private depthChartId: string;
  private changes$ = new Subject<{
    hiddenExchanges: string[];
    streams: string[];
    symbol: string;
  }>();
  private reRun$ = new BehaviorSubject(null);
  private exchanges$ = new BehaviorSubject<Set<string>>(new Set<string>());
  private exchangesUpdating = false;
  private lastSymbolRequest: string;
  private lastSymbolConfig$: Observable<any>;
  private runBook$ = new Subject<void>();
  private dataReady$ = new BehaviorSubject(false);
  private ready$ = new BehaviorSubject(false);
  private lastSubscriptionParams: string = '';
  
  constructor(
    private elementRef: ElementRef,
    private resizeObserveService: ResizeObserveService,
    private wsService: WSService,
    private orderBookIdService: OrderBookIdService,
    private cdRef: ChangeDetectorRef,
    private symbolsService: SymbolsService,
    private globalFiltersService: GlobalFiltersService,
    private storageMap: StorageMap,
  ) {}
  
  ngAfterViewInit(): void {    
    this.bookId = this.orderBookIdService.registerId().toString();
    this.depthChartId = this.orderBookIdService.registerId().toString();
    
    this.resizeObserveService
      .observe(this.elementRef.nativeElement)
      .pipe(takeUntil(this.destroy$), debounceTime(100))
      .subscribe(() => {
        this.updateSize();
      });
    
    const changes$ = this.changes$.pipe(
      debounceTime(0),
      distinctUntilChanged(equal),
    );

    combineLatest([changes$, this.reRun$])
      .pipe(
        map(([changes]) => changes),
        filter(changes => changes.symbol && changes.streams && changes.hiddenExchanges),
        filter(changes => this.lastSubscriptionParams !== changes.symbol + changes.streams + changes.hiddenExchanges),
        tap(changes => this.lastSubscriptionParams = changes.symbol + changes.streams + changes.hiddenExchanges),
        switchMap((data) => this.symbolConfig(data.symbol)),
        takeUntil(this.destroy$),
      )
      .subscribe(data => this.runBook(data));
    
    combineLatest([
      changes$.pipe(
        distinctUntilChanged(equal),
        filter(changes => changes.symbol && changes.streams && changes.hiddenExchanges),
        filter(changes => this.lastSubscriptionParams !== changes.symbol + changes.streams + changes.hiddenExchanges),
        switchMap(changes => {
          this.lastSubscriptionParams = changes.symbol + changes.streams + changes.hiddenExchanges;
          return this.getFeed(changes.symbol, changes.streams, changes.hiddenExchanges);
        })
      ),
      this.changes$.pipe(map(changes => changes.symbol)),
    ]).pipe(
      distinctUntilChanged(equal),
      map(([feed, symbol]) => {
        const maxPrecision = field => Math.max(...feed.entries.map(entry => entry[field].toString().split('.')?.[1]?.length || 0));
        const maxPrice = maxPrecision('price');
        const maxSize = maxPrecision('quantity');
        return {maxPrice, maxSize, symbol};
      }),
      concatMap(({
                   maxPrice,
                   maxSize,
                   symbol,
                 }) => this.storageMap.get('symbolPrecisionsFromFeed').pipe(map(storage => ({
        maxPrice,
        maxSize,
        storage,
        symbol,
      })))),
      concatMap(({maxPrice, maxSize, storage, symbol}) => {
        const currentPricePrecision = storage?.[symbol]?.price || 0;
        const currentSizePrecision = storage?.[symbol]?.size || 0;
        const update = {...(storage || {}) as object};
        update[symbol] = {
          price: Math.max(maxPrice, currentPricePrecision) || 0,
          size: Math.max(maxSize, currentSizePrecision) || 0,
        };
        
        const changed = storage?.[symbol] && JSON.stringify(storage?.[symbol]) !== JSON.stringify(update[symbol]);
        return this.storageMap.set('symbolPrecisionsFromFeed', update).pipe(map(() => changed));
      }),
      takeUntil(this.destroy$),
    ).subscribe(changed => {
      if (changed) {
        this.reRun.emit();
        this.reRun$.next(null);
      }
    });
    
    this.changes$.next({
      streams: this.streams,
      hiddenExchanges: this.hiddenExchanges,
      symbol: this.symbol,
    });
    
    this.exchanges$
      .pipe(
        bufferTime(300),
        map(() => [...this.exchanges$.getValue()]),
        distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
        takeUntil(this.destroy$),
      )
      .subscribe((exchanges) => {
        this.exchangesUpdating = true;
        this.exchangesChanged.next(exchanges);
        this.exchangesUpdating = false;
      });
    
    combineLatest([this.dataReady$, this.ready$])
      .pipe(
        map(([data, ready]) => data && ready),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((ready) => {
        if (ready) {
          this.readyWithData.emit();
        }
      });
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (this.exchangesUpdating) {
      return;
    }
    
    this.changes$.next({
      hiddenExchanges: this.hiddenExchanges,
      symbol: this.symbol,
      streams: this.streams,
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.facade?.destroy();
  }
  
  private runBook({quantityPrecision, pricePrecision, baseCurrency, termCurrency}) {
    this.initialized = true;
    const emitExchanges = !this.hiddenExchanges?.length;
    if (emitExchanges) {
      this.exchanges$.next(new Set<string>());
    }
    this.destroy.next();
    this.facade?.destroy();
    this.runBook$.next();
    const params = {
      default: {
        resource: {
          resources: [
            {
              name: 'RobotoCondensed_regular',
              path: '/Assets/fonts/TTF/RobotoCondensed_regular.ttf',
              type: EResourceType.font,
            },
            {
              name: 'RobotoMono_300_10',
              path: '/Assets/fonts/Bitmap/RobotoMono_300_10.xml',
              type: EResourceType.bitmap,
            },
            {
              name: 'RobotoCondensed_300_10',
              path: '/Assets/fonts/Bitmap/RobotoCondensed_300_10.xml',
              type: EResourceType.bitmap,
            },
            {
              name: 'RobotoCondensed_300_16',
              path: '/Assets/fonts/Bitmap/RobotoCondensed_300_16.xml',
              type: EResourceType.bitmap,
            },
          ],
        },
      },
    };
    this.dataReady$.next(false);
    this.ready$.next(false);
    const orderGridKernel = new OrderGridEmbeddableKernel(params);
    const feed$: Observable<IL2Package> = this.getFeed(this.symbol, this.streams, this.hiddenExchanges)
      .pipe(
        tap((message) => {
          const data = this.exchanges$.getValue();
          message.entries.forEach((entry) => data.add(entry.exchange_id));
          if (emitExchanges) {
            this.exchanges$.next(data);
          }
        }),
        takeUntil(merge(this.destroy$, this.runBook$)),
        shareReplay({bufferSize: 1, refCount: true}),
      );
    
    feed$.pipe(take(1), takeUntil(this.destroy)).subscribe(() => {
      this.dataReady$.next(true);
    });
    
    this.lastMessageTime$ = combineLatest([this.globalFiltersService.getFilters(), feed$]).pipe(
      map(([filters, message]) =>
        formatHDate(
          new Date(message.timestamp).toISOString(),
          filters.dateFormat,
          filters.timeFormat,
          filters.timezone,
        ),
      ),
    );
    
    const orderBook = new OrderBook(
      {
        subscribe: (symbol: string, appId: string): Observable<IL2Package> =>
          feed$.pipe(takeUntil(this.destroy)),
      } as any,
      () =>
        new Worker(new URL('../../streams/workers/order-book.worker.ts', import.meta.url), {
          type: 'module',
        }),
    );
    const kernels: AbstractEmbeddableKernel<unknown>[] = [orderGridKernel];
    if (this.inDepthChart) {
      kernels.push(new DepthChartEmbeddableKernel(params));
    }
    
    kernels.forEach((kernel) =>
      kernel.addExtension({
        processApp: (containerBuilder: ContainerBuilder, parameters: any) => null,
        processGlobal: (containerBuilder: ContainerBuilder) =>
          containerBuilder.set('orderBook', orderBook),
        getName: () => '',
      } as any),
    );
    
    this.facade = new MultiAppFacade(
      kernels,
      this.container.nativeElement,
      true,
      {},
      {
        resolveResource: (name: string, path: string) => path.replace('Assets', 'assets'),
      },
    );
    
    const apps = [
      this.facade.createApp('orderGrid', this.bookId, this.bookSizes(), {
        showExchangeId: true,
        mapExchangeCode: true,
        parameters: {},
        formatFunctions: {
          price: defaultFormatFunction,
          spread: defaultFormatFunction,
        },
        symbol: this.symbol,
        quantityPrecision,
        pricePrecision,
        termCode: termCurrency,
      }),
    ];
    
    if (this.inDepthChart) {
      apps.push(
        this.facade.createApp('depthChart', this.depthChartId, this.chartSizes(), {
          parameters: {
            orientation: this.orientation,
          },
          formatFunctions: {
            price: defaultFormatFunction,
            spread: defaultFormatFunction,
          },
          symbol: {
            symbol: this.symbol,
            base: {
              code: baseCurrency,
              decimalPart: pricePrecision,
            },
            term: {
              code: termCurrency,
              decimalPart: pricePrecision,
            },
          },
        }),
      );
    }
    
    combineLatest(apps.map((app) => app.pipe(filter((e) => e === 'initialized'))))
      .pipe(take(1), takeUntil(this.destroy))
      .subscribe(() => {
        this.initialized = true;
        this.updateSize();
        this.cdRef.detectChanges();
        this.ready.emit();
        this.ready$.next(true);
      });
  }
  
  private updateSize() {
    if (!this.facade) {
      return;
    }
    
    this.height = this.chartSizes().height;
    this.width = this.bookSizes().width + this.chartSizes().width + this.padding;
    this.facade['renderer'].resize(this.width, this.height);
    const state = this.facade.getSate();
    [
      {type: 'orderGrid', id: this.bookId, sizes: this.bookSizes()},
      {type: 'depthChart', id: this.depthChartId, sizes: this.chartSizes()},
    ].forEach(({type, id, sizes}) => {
      if (state?.apps[type] && state?.apps?.[type][id].containerState === 'initialized') {
        this.facade.dispatch(embeddableAppUpdatePositionAction(type, id, sizes));
      }
    });
  }
  
  private getFeed(symbol: string, streams: string[], hiddenExchanges: string[]): Observable<IL2Package> {
    if (this.feed$) {
      return this.feed$.pipe(
        map(feed => ({...feed, entries: feed.entries.map(entry => ({...entry, quantity: entry.quantity || 0}))}))
      );
    } else {
      return this.wsService
        .watchObject<IL2Package>('/user/topic/order-book', {
          instrument: symbol,
          streams: JSON.stringify(streams),
          hiddenExchanges: JSON.stringify(hiddenExchanges),
        }).pipe(
          map(feed => ({...feed, entries: feed.entries.map(entry => ({...entry, quantity: entry.quantity || 0}))})),
        );
    }
  }
  
  private chartSizes(): { width: number; height: number; x: number; y: number } {
    return {
      width: this.elementRef.nativeElement.offsetWidth - this.bookWidth - this.padding,
      height: this.elementRef.nativeElement.offsetHeight,
      x: (this.bookWidth || 0) + (this.padding || 0),
      y: 0,
    };
  }
  
  private bookSizes(): { width: number; height: number; x: number; y: number } {
    return {
      width: this.bookWidth,
      height:
        this.elementRef.nativeElement.offsetHeight -
        this.headerHeight -
        (this.showLastTime ? this.lastTimeHeight : 0),
      x: 0,
      y: this.headerHeight || 0,
    };
  }
  
  private symbolConfig(symbol: string): Observable<{
    quantityPrecision: number;
    pricePrecision: number;
    termCurrency: string;
    baseCurrency: string;
  }> {
    const requestKey = `${symbol}|${this.hiddenExchanges?.join('-')}`;
    if (this.lastSymbolRequest !== requestKey) {
      this.lastSymbolRequest = requestKey;
      this.lastSymbolConfig$ = this.symbolsService.config(symbol, this.hiddenExchanges).pipe(
        shareReplay(1),
        switchMap((config) => {
          const getPrecision = (string: string) =>
            string.indexOf('.') === -1 ? 0 : string.length - string.indexOf('.') - 1;
          
          const result = {
            termCurrency: config.termCurrency || '',
            baseCurrency: config.baseCurrency || '',
            quantityPrecision: getPrecision(config?.sizePrecision || ''),
            pricePrecision: getPrecision(config?.pricePrecision || ''),
          };
          
          return this.precisionsFromFeed().pipe(map(fromFeed => ({
            ...result,
            quantityPrecision: Math.max(result.quantityPrecision, fromFeed?.size || 0),
            pricePrecision: Math.max(result.pricePrecision, fromFeed?.price || 0),
          })));
        }),
      );
    }
    
    return this.lastSymbolConfig$;
  }
  
  toggleOrientationDropDown() {
    this.orientationDropdownOpen = !this.orientationDropdownOpen;
  }
  
  closeOrientationDropDown() {
    this.orientationDropdownOpen = false;
  }
  
  changeOrientation(orientation: EOrientations) {
    if (this.orientation !== orientation) {
      this.facade.dispatchTo(
        updateParametersAction({orientation}),
        'depthChart',
        this.depthChartId,
      );
      this.orientationChange.emit(orientation);
    }
  }
  
  private precisionsFromFeed(): Observable<{ size: number, price: number }> {
    return this.storageMap.get('symbolPrecisionsFromFeed').pipe(map(storage => storage?.[this.symbol]));
  }
}
