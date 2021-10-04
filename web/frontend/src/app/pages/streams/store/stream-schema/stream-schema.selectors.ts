import { createSelector }                     from '@ngrx/store';
import { StreamsState, streamsStoreSelector } from '../index';

export const streamsSchemaStateSelector = createSelector(
  streamsStoreSelector,
  (state: StreamsState) => state.schema,
);
