import { createSelector }                     from '@ngrx/store';
import { StreamsState, streamsStoreSelector } from '../index';
import { State as ListState }                 from './streams.reducer';

export const streamsListStateSelector = createSelector(
  streamsStoreSelector,
  (state: StreamsState) => state.list,
);

export const getStreamsList = createSelector(
  streamsListStateSelector,
  (list: ListState) => list.streams,
);
export const getOpenNewTabState = createSelector(
  streamsListStateSelector,
  (list: ListState) => list._openNewTab,
);
export const getLastStreamDescribe = createSelector(
  streamsListStateSelector,
  (list: ListState) => list.lasStreamDescribe,
);


// export const streamsListTabsSelector = createSelector(
//   streamsListStateSelector,
//   (state: StreamsListState) => state.tabs,
// );
