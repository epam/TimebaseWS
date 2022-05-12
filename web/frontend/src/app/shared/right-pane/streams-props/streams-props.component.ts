import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
}                                                                               from '@angular/core';
import { ActivatedRoute }                                                       from '@angular/router';
import { select, Store }                                                        from '@ngrx/store';
import equal                                                                    from 'fast-deep-equal';
import { combineLatest, Observable, Subject }                                   from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { AppState }                                                             from '../../../core/store';
import { TabSettingsModel }                                                     from '../../../pages/streams/models/tab.settings.model';
import * as StreamPropsActions
                                                                                from '../../../pages/streams/store/stream-props/stream-props.actions';
import * as fromStreamProps
                                                                                from '../../../pages/streams/store/stream-props/stream-props.reducer';
import { getActiveTabSettings }                                                 from '../../../pages/streams/store/streams-tabs/streams-tabs.selectors';
import { formatHDate }                                                          from '../../locale.timezone';
import { GlobalFilters }                                                        from '../../models/global-filters';
import { GlobalFiltersService }                                                 from '../../services/global-filters.service';
import { StreamsService }                                                       from '../../services/streams.service';
import { SymbolsService }                                                       from '../../services/symbols.service';
import { RightPaneService }                                                     from '../right-pane.service';

export interface KeyValue<K, V> {
  key: K;
  value: V;
}

@Component({
  selector: 'app-streams-props',
  templateUrl: './streams-props.component.html',
  styleUrls: ['./streams-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamsPropsComponent implements OnInit, OnDestroy {
  @Output() closedPropsEmit = new EventEmitter<boolean>();

  closedProps: boolean;
  props$;
  tabSettings$: Observable<TabSettingsModel>;
  tabSettings: TabSettingsModel = {};
  title$: Observable<string>;

  private destroy$ = new Subject();

  constructor(
    private route: ActivatedRoute,
    private appStore: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private globalFiltersService: GlobalFiltersService,
    private symbolsService: SymbolsService,
    private streamsService: StreamsService,
    private messageInfoService: RightPaneService,
  ) {}

  ngOnInit() {
    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));

    this.tabSettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: TabSettingsModel) => (this.tabSettings = settings));

    const routeParams$ = this.route.params as Observable<{stream: string; symbol: string}>;
    const isSymbol$ = routeParams$.pipe(map((tab) => !!tab.symbol));

    this.title$ = isSymbol$.pipe(
      map((isSymbol) => `titles.${isSymbol ? 'symbolProps' : 'streamProps'}`),
    );

    const props$ = routeParams$.pipe(
      switchMap((tab) => {
        return tab.symbol
          ? this.symbolsService.getProps(tab.stream, tab.symbol)
          : this.streamsService.getProps(tab.stream);
      }),
      shareReplay(1),
    );

    this.props$ = combineLatest([this.globalFiltersService.getFilters(), props$]).pipe(
      distinctUntilChanged(equal),
      filter(([filters, props]) => !!props),
      map(([filters, props]: [GlobalFilters, fromStreamProps.State]) => {
        return this.formatProps(JSON.parse(JSON.stringify(props)).props, filters);
      }),
    );
  }

  getFormattedDate(date: string, filter_date_format, filter_time_format, filter_timezone) {
    return formatHDate(date, filter_date_format, filter_time_format, filter_timezone);
  }

  closeProps() {
    this.messageInfoService.closeRightPanel();
  }

  ngOnDestroy(): void {
    this.appStore.dispatch(new StreamPropsActions.StopSubscriptions());
  }

  private formatProps(
    props: any,
    filters: GlobalFilters,
  ): {key: string; value: string; children: any[]}[] {
    if (!props) {
      return [];
    }

    return Object.keys(props)
      .map((key) => {
        let value = ['string', 'number'].includes(typeof props[key]) ? props[key] : null;
        if (['start', 'end'].includes(key)) {
          value = formatHDate(value, filters.dateFormat, filters.timeFormat, filters.timezone);
        }
        return {
          key,
          value,
          children: typeof props[key] === 'object' ? this.formatProps(props[key], filters) : [],
        };
      })
      .sort((a, b) => (a.key > b.key ? 1 : -1));
  }
}
