import { HttpErrorResponse }                                                             from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit }                from '@angular/core';
import { FormBuilder, FormGroup }                                                        from '@angular/forms';
import { ActivatedRoute }                                                                from '@angular/router';
import { select, Store }                                                                 from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of, ReplaySubject, Subject, timer } from 'rxjs';
import {
  catchError,
  debounceTime,
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
}                                 from 'rxjs/operators';
import { AppState }               from '../../../core/store';
import { SplitterSizesDirective } from '../../../shared/components/splitter-sizes/splitter-sizes.directive';
import { StreamsService }         from '../../../shared/services/streams.service';
import { SymbolsService }         from '../../../shared/services/symbols.service';
import { TabStorageService }      from '../../../shared/services/tab-storage.service';
import { ChartTypes }             from '../../streams/models/chart.model';
import { TabModel }               from '../../streams/models/tab.model';
import { StreamUpdatesService }   from '../../streams/services/stream-updates.service';
import { UpdateTab }              from '../../streams/store/streams-tabs/streams-tabs.actions';
import { getTabsState }           from '../../streams/store/streams-tabs/streams-tabs.selectors';

@Component({
  selector: 'app-order-book-page',
  templateUrl: './order-book-page.component.html',
  styleUrls: ['./order-book-page.component.scss'],
  providers: [TabStorageService],
})
export class OrderBookPageComponent implements OnInit, OnDestroy, AfterViewInit {
  filters: FormGroup;
  streams$: Observable<string[]>;
  symbols$: Observable<string[]>;
  loading: boolean;
  noData: boolean;
  exchanges: string[] = [];
  showFilters = false;
  hiddenExchanges: string[] = [];
  allExchangesHidden: boolean;
  precisionError: boolean;

  private destroy$ = new ReplaySubject<void>(1);
  private initForm$ = new Subject<void>();
  private selfUpdate = false;
  private bookState$ = new ReplaySubject<boolean>(1);
  private streamsUpdated$ = new BehaviorSubject<void>(null);
  
  constructor(
    private fb: FormBuilder,
    private streamsService: StreamsService,
    private symbolsService: SymbolsService,
    private cdRef: ChangeDetectorRef,
    private tabStorageService: TabStorageService<{
      hiddenExchanges: string[];
      streams: string[];
      symbol: string[];
    }>,
    private appStore: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private parentSplitterSizes: SplitterSizesDirective,
    private streamUpdatesService: StreamUpdatesService,
  ) {
  }
  
  ngOnInit() {
    combineLatest([this.tabStorageService.getData(null, false), this.getActiveTab()])
      .pipe(
        debounceTime(0),
        takeUntil(this.destroy$),
        tap(([data, {tab}]) => {
          this.precisionError = false;
          this.showFilters = false;
          this.initForm();
          this.exchanges = [];
          const patchData = data || {};
          patchData.streams = patchData.streams || (tab.stream ? [tab.stream] : []);
          patchData.symbol = patchData.symbol || (tab.symbol ? [tab.symbol] : []);
          this.filters.patchValue({...patchData, exchanges: []});
          this.showFilters = true;
        }),
      )
      .subscribe(() => this.cdRef.detectChanges());
    
    this.streams$ = this.streamsUpdated$.pipe(
      switchMap(() => this.streamsService.getList(true)),
      map((streams) =>
        streams.filter((s) => s.chartType?.includes(ChartTypes.PRICES_L2)).map(({name}) => name),
      ),
    );
    
    this.bookState$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe((state) => {
      this.loading = !state;
      this.cdRef.detectChanges();
    });
    
    this.streamUpdatesService.onUpdates().pipe(takeUntil(this.destroy$)).subscribe(update => {
      if (update.renamed.length) {
        const streamsVal = this.filters.get('streams').value;
        const streams = streamsVal ? [...streamsVal] : [];
        update.renamed.forEach(({oldName, newName}) => {
          const index = streams.findIndex(s => s === oldName);
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
    this.noData = false;
  }

  onBookDestroy() {
    this.bookState$.next(false);
  }

  onExchanges(exchanges: string[]) {
    if (!exchanges.length) {
      return;
    }

    this.tabStorageService
      .getData()
      .pipe(take(1))
      .subscribe((data) => {
        const updateExchanges = exchanges.filter((e) => !data?.hiddenExchanges?.includes(e));
        this.exchanges = exchanges;
        this.selfUpdate = true;
        this.filters.get('exchanges').patchValue(this.sortByName(updateExchanges));
        this.selfUpdate = false;
        if (data?.hiddenExchanges?.length) {
          this.loading = true;
          this.hiddenExchanges = data.hiddenExchanges;
        }
        this.cdRef.detectChanges();
      });
  }

  onExchangeDeselect(exchange: string) {
    this.hiddenExchanges = this.hiddenExchanges.concat([exchange]);
    this.tabStorageService.updateDataSync((data) => {
      data.hiddenExchanges = this.hiddenExchanges;
      return data;
    });
    this.allExchangesHidden =
      JSON.stringify(this.exchanges) === JSON.stringify(this.hiddenExchanges);
  }

  onExchangeSelect(exchange: string) {
    this.hiddenExchanges = this.hiddenExchanges.filter((e) => e !== exchange);
    this.tabStorageService.updateDataSync((data) => {
      data.hiddenExchanges = this.hiddenExchanges;
      return data;
    });
    this.allExchangesHidden = false;
  }

  onPrecisionError(error: boolean) {
    this.precisionError = error;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm() {
    this.initForm$.next();

    this.filters = this.fb.group({
      streams: [[]],
      symbol: [[]],
      exchanges: [[]],
    });

    this.filters.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        takeUntil(this.initForm$),
        filter(() => this.showFilters),
        startWith(this.filters.value),
        pairwise(),
      )
      .subscribe(([prev, current]) => {
        let freshExchanges = false;
        if (prev.symbol !== current.symbol) {
          freshExchanges = true;
          this.exchanges = [];
          this.allExchangesHidden = false;
          this.hiddenExchanges = [];
        }

        this.updateTab();

        this.tabStorageService.updateDataSync((data) => ({
          streams: current.streams,
          symbol: current.symbol,
          hiddenExchanges: freshExchanges ? [] : data?.hiddenExchanges,
        }));
      });

    let streamsSorting = false;
    const streamsControl = this.filters.get('streams');
    streamsControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        takeUntil(this.initForm$),
        filter(() => !streamsSorting),
      )
      .subscribe((data) => {
        streamsSorting = true;
        streamsControl.patchValue(this.sortByName(data), {emitEvent: false});
        streamsSorting = false;
      });

    this.symbols$ = this.filters.get('streams').valueChanges.pipe(
      startWith(null),
      map(() => this.filters.get('streams').value),
      distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
      switchMap((streams) => {
        if (!streams.length) {
          return of([]);
        }
        return combineLatest(streams.map(
          (stream) => this.symbolsService.getSymbols(stream).pipe(catchError((e: HttpErrorResponse) => {
            if (e.status === 400 && e.error.message.startsWith('Unknown stream')) {
              this.streamsUpdated$.next();
              this.filters.get('streams').patchValue(streams.filter(s => s !== stream));
            }
            
            return of([]);
          })),
        ));
      }),
      map((responses) => {
        const unique = new Set<string>();
        responses.forEach((symbols) => symbols.forEach((symbol) => unique.add(symbol)));
        return [...unique].sort((a, b) => (a > b ? 1 : -1));
      }),
      shareReplay(1),
    );

    this.symbols$
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.showFilters),
      )
      .subscribe((symbols) => {
        const chosen = this.filters.get('symbol').value[0];
        if (chosen && !symbols.includes(chosen)) {
          this.exchanges = [];
          this.precisionError = false;
          this.filters.get('symbol').patchValue([]);
        }
      });

    this.filters.valueChanges
      .pipe(
        startWith(null),
        takeUntil(this.destroy$),
        takeUntil(this.initForm$),
        filter(() => !this.selfUpdate),
        tap(() => {
          this.loading = !!this.filters.get('symbol').value[0];
          this.noData = false;
          this.cdRef.detectChanges();
        }),
        switchMap(() => timer(5000)),
      )
      .subscribe(() => {
        if (this.loading) {
          this.loading = false;
          this.noData = true;
          this.cdRef.detectChanges();
        }
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

  private getActiveTab(): Observable<{tab: TabModel; position: number}> {
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
}
