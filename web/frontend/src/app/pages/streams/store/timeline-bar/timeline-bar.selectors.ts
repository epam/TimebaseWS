import { createSelector }                     from '@ngrx/store';
import { StreamsState, streamsStoreSelector } from '../index';
import { State }                              from './timeline-bar.reducer';

export const timelineBarState = createSelector(
  streamsStoreSelector,
  (state: StreamsState) => state.bar,
);

export const timelineStartDate = createSelector(
  timelineBarState,
  (state: State) => state.startDate,
);
export const timelineEndDate = createSelector(
  timelineBarState,
  (state: State) => state.endDate,
);

