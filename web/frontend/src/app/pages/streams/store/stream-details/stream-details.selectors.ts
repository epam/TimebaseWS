import {createSelector} from '@ngrx/store';
import {StreamModel} from '../../models/stream.model';
import {TabModel} from '../../models/tab.model';
import {StreamsState, streamsStoreSelector} from '../index';
import {getStreamsList} from '../streams-list/streams.selectors';
import {State as DetailsState} from './stream-details.reducer';

export const streamsDetailsStateSelector = createSelector(
  streamsStoreSelector,
  (state: StreamsState) => state.details,
);

export const getStreamSymbols = createSelector(
  streamsDetailsStateSelector,
  (state: DetailsState) => state.symbols,
);

export const getStreamData = createSelector(
  streamsDetailsStateSelector,
  (state: DetailsState) => state.streamData,
);

export const getStreamRange = createSelector(
  streamsDetailsStateSelector,
  (state: DetailsState) => state.streamRange,
);

export const getStreamGlobalFilters = createSelector(
  streamsDetailsStateSelector,
  (state: DetailsState) => state.global_filter,
);

export const getStreamOrSymbolByID = createSelector(
  getStreamsList,
  (
    streams: StreamModel[],
    props: {streamID: string; uid: string; symbol?: string; space?: string},
  ) => {
    if (typeof streams === 'undefined' || streams === null) {
      return null;
    }
    const SYMBOL_OBJ = props.symbol ? {symbol: props.symbol} : {};
    let stream = streams.find((stream) => stream.key === props.streamID);

    if (!stream) {
      stream = {_active: false, _shown: false, key: '', name: '', symbols: 0};
      stream['streamCreate'] = true;
      stream['stream'] = props.streamID;
    } else {
      stream = {...stream};
      stream['stream'] = stream.key;
    }
    delete stream.key;

    return new TabModel({
      ...stream,
      ...SYMBOL_OBJ,
      ...(props.space ? {space: props.space} : {}),
      id: props.uid,
    });
  },
);
