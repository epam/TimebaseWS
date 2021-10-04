import { createSelector }                     from '@ngrx/store';
import { StreamsState, streamsStoreSelector } from '../index';
import { State }                              from './filter.reducer';

export const filterState = createSelector(
  streamsStoreSelector,
  (state: StreamsState) => state.filter,
);

export const filterFrom = createSelector(
  filterState,
  (state: State) => state['from'],
);

