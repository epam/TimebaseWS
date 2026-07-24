import {createSelector} from '@ngrx/store';
import {StreamsState, streamsStoreSelector} from '../index';
import {State as TimebasesState} from './timebases.reducer';

export const getTimebasesState = createSelector(
  streamsStoreSelector,
  (state: StreamsState) => state.timebases,
);

export const getTimebases = createSelector(
  getTimebasesState,
  (state: TimebasesState) => state.timebases,
);

export const getTimebasesLoaded = createSelector(
  getTimebasesState,
  (state: TimebasesState) => state.loaded,
);

export const getDefaultTimebase = createSelector(
  getTimebases,
  (timebases) => timebases?.[0] ?? null,
);
