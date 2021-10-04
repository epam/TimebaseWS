import { createSelector }                     from '@ngrx/store';
import { StreamsState, streamsStoreSelector } from '../index';

export const streamsQueryStateSelector = createSelector(
  streamsStoreSelector,
  (state: StreamsState) => state.query,
);
