import { createSelector }                     from '@ngrx/store';
import { StreamsState, streamsStoreSelector } from '../index';
import { State }                              from './stream-props.reducer';

export const streamPropsState = createSelector(
  streamsStoreSelector,
  (state: StreamsState) => state.props,
);

export const streamProps = createSelector(
  streamPropsState,
  (state: State) => state.props,
);
/*
export const streamsPropsStateSelector = createSelector(
  streamsStoreSelector,
  (state: StreamsState) => state.props.opened,
);
*/
