import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import * as Diff from 'fast-deep-equal';
import {combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, filter, map, switchMap, tap} from 'rxjs/operators';
import {AppState} from '../../../../core/store';
import {LiveGridFilters} from '../../../../shared/models/live-grid-filters';
import {SchemaTypeModel} from '../../../../shared/models/schema.type.model';
import {StreamsService} from '../../../../shared/services/streams.service';
import {TabModel} from '../../models/tab.model';
import * as StreamDetailsActions from '../../store/stream-details/stream-details.actions';
import {StreamDetailsEffects} from '../../store/stream-details/stream-details.effects';
import * as fromStreams from '../../store/streams-list/streams.reducer';
import {getActiveOrFirstTab} from '../../store/streams-tabs/streams-tabs.selectors';

@Component({
  selector: 'app-streams-grid-live',
  templateUrl: './streams-grid-live.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamsGridLiveComponent implements OnInit {
  schemaData$: Observable<{all: SchemaTypeModel[]; types: SchemaTypeModel[]}>;
  filters$: Observable<LiveGridFilters>;
  tabName: string;

  constructor(
    private appStore: Store<AppState>,
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamDetailsEffects: StreamDetailsEffects,
    private streamsService: StreamsService,
  ) {}

  ngOnInit() {
    this.schemaData$ = this.streamDetailsEffects.setSchema.pipe(
      map((action) => ({types: action.payload.schema, all: action.payload.schemaAll})),
    );

    const tab$ = this.appStore.pipe(
      select(getActiveOrFirstTab),
      filter((tab: TabModel) => tab?.live),
      distinctUntilChanged((prevTabModel: TabModel, nextTabModel: TabModel) => {
        const PREV = new TabModel(prevTabModel);
        const NEXT = new TabModel(nextTabModel);
        delete PREV.tabSettings;
        delete NEXT.tabSettings;
        return Diff(PREV, NEXT);
      }),
    );

    const props$ = tab$.pipe(switchMap((tab) => this.streamsService.getProps(tab.stream)));

    this.filters$ = combineLatest([tab$, props$]).pipe(
      tap(([tab]) => {
        this.tabName = tab.id;
        this.streamsStore.dispatch(new StreamDetailsActions.GetSchema({streamId: tab.stream}));
      }),
      distinctUntilChanged(),
      map(([tab, props]) => {
        const dateEnd = new Date(props.props.range['end']).getTime() + 1;
        const filters = {
          symbols: null,
          fromTimestamp: new Date(dateEnd).toISOString(),
          destination: `/user/topic/monitor/${escape(tab.stream)}`,
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
