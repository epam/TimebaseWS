import { HttpClient }           from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
}                               from '@angular/core';
import { FormControl }          from '@angular/forms';
import { IL2Package }           from '@deltix/hd.components-order-book/lib/l2';
import {
  select,
  Store,
}                               from '@ngrx/store';
import { Column }               from 'ag-grid-community';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  ReplaySubject,
  Subject,
  timer,
}                               from 'rxjs';
import { isArray }              from 'rxjs/internal-compatibility';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
  takeUntil,
  withLatestFrom,
}                               from 'rxjs/operators';
import { AppState }             from '../../../core/store';
import { ChartTypes }           from '../../../pages/streams/models/chart.model';
import { StreamDetailsModel }   from '../../../pages/streams/models/stream.details.model';
import { TabModel }             from '../../../pages/streams/models/tab.model';
import { getActiveTab }         from '../../../pages/streams/store/streams-tabs/streams-tabs.selectors';
import { GlobalFiltersService } from '../../services/global-filters.service';
import { ResizeObserveService } from '../../services/resize-observe.service';
import { TabStorageService }    from '../../services/tab-storage.service';
import { HasRightPanel }        from '../has-right-panel';
import { RightPaneService }     from '../right-pane.service';

@Component({
  selector: 'app-message-info',
  templateUrl: './message-info.component.html',
  styleUrls: ['./message-info.component.scss'],
})
export class MessageInfoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('infoContentWrapper') infoContentWrapper: ElementRef<HTMLElement>;

  @Input() showOrderBook = true;

  canShowOrderBook$: Observable<boolean>;
  tab$: Observable<TabModel>;
  props$: Observable<{key: string; value: string}[]>;
  editorOptions = {
    theme: 'vs-dark',
    language: 'json',
    automaticLayout: true,
    codeLens: false,
    minimap: {enabled: false},
    readOnly: true,
  };
  editorValue$: Observable<string>;
  viewControl = new FormControl('view');
  orderBookStreams$: Observable<string[]>;
  orderBookSymbol$: Observable<string>;
  orderBookFeed$ = new ReplaySubject<IL2Package>(1);
  elementWidth$: Observable<number>;
  showOrderBook$: Observable<boolean>;
  orderBookNoData$: Observable<boolean>;
  orderBookError$: Observable<string>;
  hideOrderBook$ = new BehaviorSubject(true);
  showLoader$: Observable<boolean>;
  tabSwitching$ = new BehaviorSubject(true);
  feedSymbol$ = new BehaviorSubject<string>(null);
  feedFiltered$: Observable<IL2Package>;
  message$: Observable<Partial<HasRightPanel>>;

  private destroy$ = new Subject();

  constructor(
    private appStore: Store<AppState>,
    private globalFiltersService: GlobalFiltersService,
    private tabStorageService: TabStorageService<HasRightPanel>,
    private messageInfoService: RightPaneService,
    private httpClient: HttpClient,
    private resizeObserveService: ResizeObserveService,
  ) {}

  ngOnInit() {
    this.tab$ = this.appStore.pipe(
      select(getActiveTab),
      filter((t) => !!t),
    );

    this.canShowOrderBook$ = this.tab$.pipe(
      map((tab) => tab.chartType?.includes(ChartTypes.PRICES_L2)),
    );

    this.tab$
      .pipe(
        distinctUntilChanged((t1, t2) => t1.id === t2.id),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.tabSwitching$.next(true);
        this.hideOrderBook$.next(true);
      });

    this.message$ = this.tabStorageService.flow('rightPanel').getData(['selectedMessage']);

    this.props$ = combineLatest([
      this.message$,
      this.messageInfoService.onColumns(),
      this.globalFiltersService.getFilters(),
    ]).pipe(map(([data, columns]) => this.getProps(data.selectedMessage, columns)));
    this.editorValue$ = this.message$.pipe(
      map((message) => JSON.stringify(message.selectedMessage, null, '\t')),
    );

    const storageMessageView$ = this.tabStorageService
      .flow('rightPanel')
      .getData(['messageView'])
      .pipe(map((data) => data?.messageView || 'view'));

    storageMessageView$.pipe(takeUntil(this.destroy$)).subscribe((messageView) => {
      this.viewControl.patchValue(messageView, {emitEvent: false});
    });

    this.viewControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((messageView) => {
      this.tabSwitching$.next(true);
      this.hideOrderBook$.next(true);
      this.tabStorageService.flow('rightPanel').updateDataSync((data) => ({...data, messageView}));
    });

    this.orderBookStreams$ = this.tab$.pipe(map((tab) => [tab.stream]));
    this.orderBookSymbol$ = this.message$.pipe(map((message) => message.selectedMessage?.symbol));
    combineLatest([
      this.message$.pipe(filter((data) => !!data.selectedMessage)),
      storageMessageView$,
    ])
      .pipe(
        filter(([message, view]) => view === 'orderBook'),
        withLatestFrom(this.tab$),
      )
      .pipe(
        debounceTime(100),
        switchMap(([[message], tab]) => {
          this.tabSwitching$.next(false);

          if (message.selectedMessage.symbol !== this.feedSymbol$.getValue()) {
            this.hideOrderBook$.next(true);
            this.orderBookFeed$.next(null);
          }
          const params = {
            streams: [tab.stream],
            symbol: message.selectedMessage?.symbol,
            types: tab.filter.filter_types || null,
            symbols: tab.symbol ? [tab.symbol] : tab.filter.filter_symbols || null,
            from: message.from,
            offset: message.rowIndex,
            reverse: tab.reverse,
          };

          if (tab.space !== undefined) {
            params['space'] = tab.space;
          }
          return this.httpClient
            .post<IL2Package>('/order-book', params)
            .pipe(map((feed) => ({feed, symbol: message.selectedMessage?.symbol})));
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(({feed, symbol}) => {
        this.feedSymbol$.next(symbol);
        this.orderBookFeed$.next(feed);
      });

    this.showOrderBook$ = combineLatest([
      this.orderBookStreams$,
      this.orderBookSymbol$,
      this.orderBookFeed$,
    ]).pipe(map(([streams, symbols, feed]) => !!streams && !!symbols && !!feed?.entries.length));

    this.showOrderBook$.pipe(takeUntil(this.destroy$)).subscribe((show) => {
      if (!show) {
        this.hideOrderBook$.next(true);
      }
    });

    this.showLoader$ = combineLatest([this.orderBookFeed$, this.hideOrderBook$]).pipe(
      map(([feed, hide]) => (feed === null && !!hide) || (!!hide && !!feed?.entries.length)),
      startWith(true),
    );

    this.orderBookNoData$ = this.orderBookFeed$.pipe(map((feed) => feed?.entries.length === 0));
    this.orderBookError$ = this.orderBookFeed$.pipe(
      map((feed) => {
        return feed?.entries.length === 0 ? feed['error'] || 'rightPanel.noMessageSelected' : null;
      }),
    );

    this.feedFiltered$ = combineLatest([
      this.orderBookFeed$,
      this.orderBookSymbol$,
      this.feedSymbol$,
    ]).pipe(
      debounceTime(0),
      filter(([feed]) => !!feed),
      filter(([feed, symbol, gotSymbol]) => symbol === gotSymbol),
      map(([feed, symbol]) => feed),
    );
  }

  onOrderBookReady() {
    timer(100).subscribe(() => this.hideOrderBook$.next(false));
  }

  ngAfterViewInit() {
    this.elementWidth$ = this.resizeObserveService
      .observe(this.infoContentWrapper.nativeElement)
      .pipe(map(() => this.infoContentWrapper.nativeElement.offsetWidth - 40));
  }

  onCloseMSGInfo() {
    this.messageInfoService.closeRightPanel();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private getProps(message: Partial<StreamDetailsModel>, columns: Column[]) {
    if (!message) {
      return [];
    }

    const MSG_ARRAY = [];
    const renderers = {};
    columns?.forEach(
      (c) => (renderers[c.getColId()] = c.getColDef().cellRenderer || c.getColDef().valueFormatter),
    );
    Object.keys(message).forEach((msgKey) => {
      const PROP = message[msgKey],
        MSG: {key: string; value?: string} = {
          key: msgKey,
        };
      if (typeof PROP === 'object') {
        MSG.value = '';
        Object.keys(PROP).forEach((childPropKey) => {
          if (typeof PROP[childPropKey] === 'object') {
            MSG_ARRAY.push({
              key: childPropKey,
              value: JSON.stringify(PROP[childPropKey]),
            });
          } else {
            const colId = `${msgKey}.${childPropKey}`;
            MSG_ARRAY.push({
              key: childPropKey,
              value: renderers[colId]
                ? renderers[colId]({value: PROP[childPropKey]})
                : PROP[childPropKey],
            });
          }
        });
      } else if (isArray(PROP)) {
        MSG.value = JSON.stringify(PROP);
      } else {
        MSG.value = renderers[msgKey] ? renderers[msgKey]({value: PROP}) : PROP;
      }
      MSG_ARRAY.push(MSG);
    });
    return MSG_ARRAY.reverse();
  }
}
