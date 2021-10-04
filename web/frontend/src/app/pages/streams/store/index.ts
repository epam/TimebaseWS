import { ActionReducerMap, createFeatureSelector } from '@ngrx/store';

import { reducer as fromList, State as ListState} from './streams-list/streams.reducer';
import { reducer as fromDetails, State as DetailsState} from './stream-details/stream-details.reducer';
import { reducer as fromProps, State as PropsState} from './stream-props/stream-props.reducer';
import { reducer as fromBar, State as BarState} from './timeline-bar/timeline-bar.reducer';
import { reducer as fromFilter, State as FilterState} from './filter/filter.reducer';
import { reducer as fromTabs, State as TabsState} from './streams-tabs/streams-tabs.reducer';
import { reducer as fromSchema, State as SchemaState} from './stream-schema/stream-schema.reducer';
import { reducer as fromQuery, State as QueryState} from './stream-query/stream-query.reducer';

export const streamsStoreSelector = createFeatureSelector<StreamsState>('streams-store');

export interface StreamsState {
  details: DetailsState;
  props: PropsState;
  list: ListState;
  bar: BarState;
  filter: FilterState;
  tabs: TabsState;
  schema: SchemaState;
  query: QueryState;
}

export const reducers: ActionReducerMap<StreamsState> = {
  details: fromDetails,
  props: fromProps,
  list: fromList,
  bar: fromBar,
  filter: fromFilter,
  tabs: fromTabs,
  schema: fromSchema,
  query: fromQuery,
};
