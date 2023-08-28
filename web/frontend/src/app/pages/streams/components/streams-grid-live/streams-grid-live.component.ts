import { ChangeDetectionStrategy, Component, OnInit }                                 from '@angular/core';
import { ActivatedRoute }                                                             from '@angular/router';
import { select, Store }                                                              from '@ngrx/store';
import * as Diff                                                                      from 'fast-deep-equal';
import { BehaviorSubject, combineLatest, Observable, of }                             from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { AppState }                                                                   from '../../../../core/store';
import { LiveGridFilters }                                                            from '../../../../shared/models/live-grid-filters';
import { SchemaTypeModel }                                                            from '../../../../shared/models/schema.type.model';
import { SchemaService }                                                              from '../../../../shared/services/schema.service';
import { StreamsService }                                                             from '../../../../shared/services/streams.service';
import { TabModel }                                                                   from '../../models/tab.model';
import * as StreamDetailsActions
                                                                                      from '../../store/stream-details/stream-details.actions';
import { StreamDetailsEffects }                                                       from '../../store/stream-details/stream-details.effects';
import * as fromStreams
                                                                                      from '../../store/streams-list/streams.reducer';
import { getActiveOrFirstTab }                                                        from '../../store/streams-tabs/streams-tabs.selectors';

@Component({
  selector: 'app-streams-grid-live',
  templateUrl: './streams-grid-live.component.html',
  styleUrls: ['./streams-grid-live.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamsGridLiveComponent implements OnInit {
  schemaData$: Observable<{ all: SchemaTypeModel[]; types: SchemaTypeModel[] }>;
  filters$: Observable<LiveGridFilters>;
  tabName: string;
  error$ = new BehaviorSubject(null);
  loaded$ = new BehaviorSubject(false);
  
  constructor(
    private appStore: Store<AppState>,
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamDetailsEffects: StreamDetailsEffects,
    private streamsService: StreamsService,
    private activatedRoute: ActivatedRoute,
    private schemaService: SchemaService,
  ) {}
  
  ngOnInit() {
    const tab$ = this.activatedRoute.params.pipe(
      switchMap(() => this.appStore.pipe(select(getActiveOrFirstTab))),
      filter((tab: TabModel) => tab?.live),
      distinctUntilChanged((prevTabModel: TabModel, nextTabModel: TabModel) => {
        const PREV = new TabModel(prevTabModel);
        const NEXT = new TabModel(nextTabModel);
        delete PREV.tabSettings;
        delete NEXT.tabSettings;
        return Diff(PREV, NEXT);
      }),
      tap(tab => this.tabName = tab.id),
    );
    
    const getSchema = (tab) => {
      this.error$.next(null);
      this.loaded$.next(false);
      return this.schemaService.getSchema(tab.stream, null, true).pipe(
        catchError(e => {
          this.error$.next(e);
          return of(null);
        }),
        tap(() => this.loaded$.next(true)),
        filter(p => !!p),
      );
    };
    
    this.schemaData$ = tab$.pipe(
      switchMap(getSchema),
    );
    
    const props$ = tab$.pipe(
      switchMap((tab) => {
        return this.streamsService.getProps(tab.stream).pipe(
          catchError(e => of(null)),
          filter(p => !!p),
        );
      }),
    );
    
    this.filters$ = combineLatest([tab$, props$]).pipe(
      map(([tab, props]) => {
        const dateEnd = new Date(props.props.range['end']).getTime() + 1;
        const filters = {
          symbols: null,
          fromTimestamp: new Date(dateEnd).toISOString(),
          destination: `/user/topic/monitor/${encodeURIComponent(tab.stream)}`,
          space: tab.space,
          types: tab.filter.filter_types,
        };
        
        if (tab.symbol) {
          filters.symbols = [tab.symbol];
        }
        
        if (tab.filter.filter_symbols?.length) {
          filters.symbols = tab.filter.filter_symbols;
        }
        
        return filters;
      }),
    );
  }
}
