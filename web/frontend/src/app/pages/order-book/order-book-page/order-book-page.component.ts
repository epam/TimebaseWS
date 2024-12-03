import { HttpErrorResponse }                                                    from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit }       from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup }                                               from '@angular/forms';
import { ActivatedRoute }                                                       from '@angular/router';
import { select, Store }                                                        from '@ngrx/store';
import equal                                                                    from 'fast-deep-equal/es6';
import { BehaviorSubject, combineLatest, Observable, of, ReplaySubject, timer } from 'rxjs';
import {
  catchError,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  shareReplay,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
}                                                                               from 'rxjs/operators';
import { AppState }                                                             from '../../../core/store';
import { SplitterSizesDirective }                                               from '../../../shared/components/splitter-sizes/splitter-sizes.directive';
import { StreamsService }                                                       from '../../../shared/services/streams.service';
import { SymbolsService }                                                       from '../../../shared/services/symbols.service';
import { TabStorageService }                                                    from '../../../shared/services/tab-storage.service';
import { ChartTypes }                                                           from '../../streams/models/chart.model';
import { TabModel }                                                             from '../../streams/models/tab.model';
import { StreamUpdatesService }                                                 from '../../streams/services/stream-updates.service';
import { UpdateTab }                                                            from '../../streams/store/streams-tabs/streams-tabs.actions';
import { getTabsState }                                                         from '../../streams/store/streams-tabs/streams-tabs.selectors';
import { EOrientations }                                                        from '../order-book/order-book.component';
import { StreamSourceService } from '../../streams/services/stream-source.service';
import { StreamModel } from '../../streams/models/stream.model';
import { ViewsService } from 'src/app/shared/services/views.service';

@Component({
  selector: 'app-order-book-page',
  templateUrl: './order-book-page.component.html',
  styleUrls: ['./order-book-page.component.scss'],
  providers: [TabStorageService],
})
export class OrderBookPageComponent implements OnInit, OnDestroy, AfterViewInit {
  filters: UntypedFormGroup;
  streams: { key: string, name: string }[];
  streams$: Observable<{ key: string, name: string }[]>;
  streamNames$: Observable<string[]>;
  symbols$: Observable<string[]>;
  loading: boolean = true;
  noData: boolean = false;
  hiddenExchanges$: Observable<string[]>;
  exchanges$: Observable<string[]>;
  orientation$: Observable<EOrientations>;
  orderBookFiltersReady = false;
  sourceOptions: string[];
  
  private destroy$ = new ReplaySubject<void>(1);
  private bookState$ = new ReplaySubject<boolean>(1);
  private streamsUpdated$ = new BehaviorSubject<void>(null);
  private selectedStreams: string[];
  private bookIsEmpty: boolean;

  constructor(
    private fb: UntypedFormBuilder,
    private streamsService: StreamsService,
    private symbolsService: SymbolsService,
    private cdRef: ChangeDetectorRef,
    private tabStorageService: TabStorageService<{
      hiddenExchanges: string[];
      exchanges: string[];
      streams: string[];
      symbol: string[];
      orientation: EOrientations;
      source: string
    }>,
    private appStore: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private parentSplitterSizes: SplitterSizesDirective,
    private streamUpdatesService: StreamUpdatesService,
    private streamSourceService: StreamSourceService,
    private viewService: ViewsService
  ) {}
  
  ngOnInit() {
    this.initForm();
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.orderBookFiltersReady = false;
    });
    
    this.orientation$ = this.tabStorageService
      .getData()
      .pipe(map((data) => data?.orientation || EOrientations.price));
    
    this.hiddenExchanges$ = this.getActiveTab().pipe(
      switchMap(() => this.tabStorageService.getData(['hiddenExchanges'])),
      map((data) => data?.hiddenExchanges || []),
    );
    
    const storageData$ = this.getActiveTab().pipe(
      switchMap((tab) =>
        this.tabStorageService.getData().pipe(map((data) => ({data, tab: tab.tab}))),
      ),
      map(({data, tab}) => ({
        ...data,
        streams: data?.streams || (tab.stream ? [tab.stream] : null),
        symbol: data?.symbol || (tab?.symbol ? [tab.symbol] : null),
        source: data?.source ? [data.source] : null
        })
      ),
      distinctUntilChanged(equal),
      shareReplay(1),
    );

    this.exchanges$ = storageData$.pipe(
      map((data) => {
        if (!data?.symbol?.length) {
          return null;
        }
        
        return data?.exchanges ? this.sortByName(data?.exchanges) : null;
      }),
      distinctUntilChanged(equal),
    );
    
    let patching = false;
    const patchFilters = (callback) => {
      patching = true;
      callback();
      patching = false;
    };
    
    combineLatest([this.exchanges$.pipe(filter((e) => !!e)), this.hiddenExchanges$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([exchanges, hiddenExchanges]) => {
        patchFilters(() =>
          this.filters.get('exchanges').patchValue(
            exchanges.filter((e) => !hiddenExchanges.includes(e)),
            {emitEvent: false},
          ));
      });
    
    storageData$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      patchFilters(() =>
        this.filters.patchValue({
          streams: data?.streams || [],
          symbol: data?.symbol || [],
          source: data?.source,
        }),
      );
    });
    
    storageData$
      .pipe(
        take(1),
        switchMap(() => this.filters.valueChanges.pipe(startWith(this.filters.value))),
        distinctUntilChanged(equal),
        pairwise(),
        filter(() => !patching),
        takeUntil(this.destroy$),
      )
      .subscribe(([prev, current]) => {
        const freshExchanges =
          (prev.symbol[0] && prev.symbol[0] !== current.symbol[0]) ||
          (prev.streams && JSON.stringify(prev.streams) !== JSON.stringify(current.streams));
        
        this.updateTab();
        
        this.tabStorageService.updateDataSync((data) => ({
          ...data,
          streams: current.streams,
          symbol: current.symbol,
          source: current.source?.[0],
          hiddenExchanges: freshExchanges ? [] : data?.hiddenExchanges,
          exchanges: freshExchanges ? null : data?.exchanges,
        }));
      });
    
    this.streams$ = combineLatest(
      [this.streamsUpdated$.pipe(
        switchMap(() => this.streamsService.getList(true)),
        map((streams) =>
          streams
            .filter((s) => !!s.chartType?.find((ct) => ct.chartType === ChartTypes.PRICE_LEVELS))
            .map(({key, name}) => ( { key, name } ))
        ),
      ),
      this.viewService.getViews().pipe(map(views => views.map(view => ({ key: view.stream, name: view.stream }))))
    ]).pipe(map(([streams, viewStreams]) => [...streams, ...viewStreams]));

    this.filters.get('streams').valueChanges
      .pipe(
        startWith(this.filters.get('streams').value),
        filter(streams => !!streams.length),
        distinctUntilChanged(equal),
        switchMap((streams: string[]) => {
          this.selectedStreams = streams;
          return this.streams$;
        }),
        delay(500),
        switchMap((streamList: StreamModel[]) => {
          const selectedStreamKeys = [];
          streamList.forEach(stream => {
            if (this.selectedStreams.includes(stream.name)) {
              selectedStreamKeys.push(stream.key);
            }
          })
          return this.streamSourceService.getAvailableSources(selectedStreamKeys);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((sources: string[]) => {
        const sourceSet = new Set<string>();
        sources.forEach(source => sourceSet.add(source));
        this.sourceOptions = Array.from(sourceSet);
        if (!this.filters.get('source').value?.length) {
          this.filters.patchValue({
            source: this.sourceOptions.includes('L2') ? ['L2'] : [ this.sourceOptions[0] ]
          });
        }
      })

    this.streamNames$ = this.streams$.pipe(map((s) => s.map(str => str.name)));

    this.symbols$ = this.streams$.pipe(
      tap(streams => this.streams = streams),
      switchMap(() => storageData$),
      switchMap((data) => {
        if (!data?.streams?.length) {
          return of([]);
        }
        return combineLatest(
          data.streams.map((streamName: string) => {
            const stream = this.streams.find(streamItem => streamItem.name === streamName);

            return this.symbolsService.getSymbols(stream.key).pipe(
              catchError((e: HttpErrorResponse) => {
                if (e.status === 400 && e.error.message.startsWith('Unknown stream')) {
                  this.streamsUpdated$.next();
                  this.filters.get('streams').patchValue(data.streams.filter((s) => s !== stream));
                }
                
                return of([]);
              })
            )
          }),
        );
      }),
      map((responses) => {
        const unique = new Set<string>();
        responses.forEach((symbols) => symbols.forEach((symbol) => unique.add(symbol)));
        return [...unique].sort((a, b) => (a > b ? 1 : -1));
      }),
      shareReplay(1),
    );
    
    this.symbols$.pipe(takeUntil(this.destroy$)).subscribe((symbols) => {
      const chosen = this.filters.get('symbol').value[0];
      if (chosen && !symbols.includes(chosen)) {
        this.filters.get('symbol').patchValue([]);
      }
    });
    
    storageData$
      .pipe(
        tap((data) => {
          this.orderBookFiltersReady = !!(
            data?.symbol?.length &&
            data?.streams?.length &&
            (data.exchanges?.length !== data.hiddenExchanges?.length ||
              !data.hiddenExchanges?.length)
          );
        }),
        map((data) => ({...data, orientation: null, exchanges: null})),
        distinctUntilChanged(equal),
        takeUntil(this.destroy$),
        switchMap(() => {
          this.loading = true;
          if (!this.bookIsEmpty) {
            this.noData = false;
          }
          this.cdRef.detectChanges();
          return timer(5000);
        }),
      )
      .subscribe(() => {
        this.loading = false;
        
        this.cdRef.detectChanges();
      });
    
    this.bookState$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => {
      if (!this.bookIsEmpty) {
        this.noData = false;
      }
      this.cdRef.detectChanges();
    });
    
    this.streamUpdatesService
      .onUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe((update) => {
        if (update.renamed.length) {
          const selectedStreams = this.streams
            .filter(stream => this.filters.get('streams').value.includes(stream.name)).map(stream => stream.key);
          const streams = selectedStreams ? [...selectedStreams] : [];
          update.renamed.forEach(({oldName, newName}) => {
            const index = streams.findIndex((s) => s === oldName);
            if (index > -1) {
              streams.splice(index, 1, newName);
            }
          });
          this.filters.get('streams').patchValue(streams);
          this.streamsUpdated$.next();
          this.cdRef.detectChanges();
        }
      });
  }
  
  ngAfterViewInit() {
    timer().subscribe(() => this.parentSplitterSizes.setChildMinSize(1, 1130));
  }
  
  onBookReady() {
    this.bookState$.next(true);
  }
  
  onBookDestroy() {
    this.bookState$.next(false);
  }

  get streamKeys() {
    const value = this.filters.get('streams').value;
    return this.streams$.pipe(
      map(s => s.filter(str => value.includes(str.name)).map(str => str.key))
    )
  }
  
  onExchanges(exchanges: string[]) {
    if (!exchanges.length) {
      return;
    }
    
    this.tabStorageService.updateDataSync((data) => ({
      ...data,
      exchanges: [...new Set(exchanges.concat(data?.hiddenExchanges || []))],
    }));
  }
  
  onExchangeDeselect(exchange: string) {
    this.tabStorageService.updateDataSync((data) => {
      data.hiddenExchanges = (data.hiddenExchanges || []).concat([exchange]);
      return data;
    });
  }
  
  onExchangeSelect(exchange: string) {
    this.tabStorageService.updateDataSync((data) => {
      data.hiddenExchanges = data.hiddenExchanges?.filter((e) => e !== exchange) || [];
      return data;
    });
  }
  
  onOrientationChanged(orientation: EOrientations) {
    this.tabStorageService.updateDataSync((data) => ({...data, orientation}));
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initForm() {
    this.filters = this.fb.group({
      streams: [[]],
      symbol: [[]],
      exchanges: [[]],
      source: [[]]
    });
    
    let streamsSorting = false;
    const streamsControl = this.filters.get('streams');
    streamsControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        filter(() => !streamsSorting),
      )
      .subscribe((data) => {
        streamsSorting = true;
        streamsControl.patchValue(this.sortByName(data), {emitEvent: false});
        streamsSorting = false;
      });
  }
  
  private sortByName(data: string[]) {
    return data.sort((v1, v2) => (v1.toLowerCase() > v2.toLowerCase() ? 1 : -1));
  }
  
  private updateTab(): void {
    this.getActiveTab()
      .pipe(take(1))
      .subscribe(({tab, position}) => {
        tab.symbol = this.filters.get('symbol').value[0];
        this.appStore.dispatch(new UpdateTab([{tab, position}]));
      });
  }
  
  private getActiveTab(): Observable<{ tab: TabModel; position: number }> {
    return this.activatedRoute.params.pipe(
      switchMap(({id}) =>
        this.appStore.pipe(
          select(getTabsState),
          map(({tabs}) => {
            const position = tabs.findIndex((tab) => tab.id === id);
            const tab = tabs[position];
            return {tab, position};
          }),
          take(1),
        ),
      ),
    );
  }

  toggleErrorMessage(bookIsEmpty: boolean) {
    this.noData = bookIsEmpty;
    this.bookIsEmpty = bookIsEmpty;
  }
}
