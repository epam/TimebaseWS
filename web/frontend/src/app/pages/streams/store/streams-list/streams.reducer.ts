import { AppState }                           from '../../../../core/store';
import { StreamDescribeModel }                from '../../models/stream.describe.model';
import { StreamModel }                        from '../../models/stream.model';
import { StreamsStateModel }                  from '../../models/streams.state.model';
import { StreamsActions, StreamsActionTypes } from './streams.actions';


export interface FeatureState extends AppState {
  streams: State;
  _openNewTab: boolean;
  dbState: StreamsStateModel;
}

export interface State {
  streams: StreamModel[];
  _openNewTab: boolean;
  _showSpaces: boolean;
  dbState: StreamsStateModel;
  lasStreamDescribe: StreamDescribeModel;
  // tabs: TabModel[];
}

export const initialState: State = {
  streams: null,
  _openNewTab: false,
  _showSpaces: false,
  dbState: null,
  // tabs: null,
  lasStreamDescribe: null,
};

const streamSorter = (stream1: StreamModel, stream2: StreamModel): number => {
  const STREAM_NAME_1 = (stream1.name ? stream1.name : stream1.key).toLocaleLowerCase(),
    STREAM_NAME_2 = (stream2.name ? stream2.name : stream2.key).toLocaleLowerCase();
  if (STREAM_NAME_1 > STREAM_NAME_2) {
    return 1;
  } else if (STREAM_NAME_1 < STREAM_NAME_2) {
    return -1;
  }
  return 0;
};

export function reducer(state = initialState, action: StreamsActions): State {
  let selectedStream, selectedStreamIndex/*, tabs: TabModel[], selectedTab: TabModel, selectedTabIndex: number*/;
  switch (action.type) {
    case StreamsActionTypes.SET_STREAMS:
      return {
        ...state,
        streams: action.payload.streams.sort(streamSorter),
      };

    case StreamsActionTypes.SET_STREAM_DESCRIBE:
      return {
        ...state,
        lasStreamDescribe: action.payload.describe,
      };

    case StreamsActionTypes.DELETE_STREAM:
      selectedStreamIndex = state.streams.findIndex(stream => stream.key === action.payload.streamKey);
      if (selectedStreamIndex > -1) {
        if (!action.payload.spaceName) {
          state.streams.splice(selectedStreamIndex, 1);
        } else if (state.streams[selectedStreamIndex]._spacesList) {
          state.streams[selectedStreamIndex]._spacesList = state.streams[selectedStreamIndex]._spacesList.filter(space => space.name !== action.payload.spaceName);
        }
      }
      return {
        ...state,
        streams: [...state.streams]/*.sort(streamSorter)*/,
      };

    case StreamsActionTypes.RENAME_STREAM:
      selectedStreamIndex = state.streams.findIndex(stream => stream.key === action.payload.streamId);
      if (selectedStreamIndex > -1) {
        if (!action.payload.spaceName) {
          state.streams[selectedStreamIndex] = {
            ...state.streams[selectedStreamIndex],
            key: action.payload.newName,
            name: action.payload.newName,
          };
        } else if (state.streams[selectedStreamIndex]._spacesList) {
          const SPACE_INDEX = state.streams[selectedStreamIndex]._spacesList.findIndex(space => space.name === action.payload.spaceName);
          if (SPACE_INDEX > -1) {
            state.streams[selectedStreamIndex]._spacesList[SPACE_INDEX] = {
              ...state.streams[selectedStreamIndex]._spacesList[SPACE_INDEX],
              name: action.payload.newName,
            };
          }
        }
      }
      return {
        ...state,
        streams: [...state.streams].sort(streamSorter),
      };

    case StreamsActionTypes.RENAME_SYMBOL:
      selectedStreamIndex = state.streams.findIndex(stream => stream.key === action.payload.streamId);
      if (selectedStreamIndex > -1 &&
        state.streams[selectedStreamIndex]._symbolsList &&
        state.streams[selectedStreamIndex]._symbolsList.length) {
        const symbolIndex = state.streams[selectedStreamIndex]._symbolsList.findIndex(symbol => symbol === action.payload.oldSymbolName);
        if (symbolIndex > -1) {
          state.streams[selectedStreamIndex]._symbolsList.splice(symbolIndex, 1, action.payload.newSymbolName);
          state.streams[selectedStreamIndex] = {
            ...state.streams[selectedStreamIndex],
            _symbolsList: [...state.streams[selectedStreamIndex]._symbolsList],
          };
        }
      }
      return {
        ...state,
        streams: [...state.streams].sort(streamSorter),
      };

    case StreamsActionTypes.SET_SYMBOLS:
      selectedStream = state.streams.find(stream => stream.key === action.payload.streamKey);
      const symbolList = action.payload.symbols.sort();
      if (selectedStream) {
        if (typeof action.payload.spaceName === 'string') {
          const currentSpace = selectedStream._spacesList.find(space => space.name === action.payload.spaceName);
          if (currentSpace) {
            currentSpace._symbolsList = symbolList;
            currentSpace._shown = true;
          }
          delete selectedStream._symbolsList;
        } else {
          selectedStream._symbolsList = symbolList;
          selectedStream._shown = selectedStream._active = true;
          delete selectedStream._spacesList;
        }
      }
      return {
        ...state,
        streams: [...state.streams],
      };

    case StreamsActionTypes.SET_SPACES:
      selectedStream = state.streams.find(stream => stream.key === action.payload.streamKey);
      if (selectedStream) {
        delete selectedStream._symbolsList;
        selectedStream._spacesList = [...action.payload.spaces];
        selectedStream._shown = selectedStream._active = true;
      }
      return {
        ...state,
        streams: [...state.streams],
      };


    case StreamsActionTypes.SET_STREAM_STATE:
      selectedStreamIndex = state.streams.findIndex(stream => stream.key === action.payload.stream.key);
      if (selectedStreamIndex > -1) {
        const STREAM = state.streams[selectedStreamIndex];
        if (typeof action.payload.spaceName === 'string' && STREAM._spacesList) {
          const CURRENT_SPACE_IDX = STREAM._spacesList.findIndex(space => space.name === action.payload.spaceName);
          if (CURRENT_SPACE_IDX > -1) {
            STREAM._spacesList[CURRENT_SPACE_IDX] = {
              ...STREAM._spacesList[CURRENT_SPACE_IDX],
              ...action.payload.props,
            };
            STREAM._shown = STREAM._active = true;
          }
          state.streams[selectedStreamIndex] = {...STREAM};
        } else {
          state.streams[selectedStreamIndex] = {
            ...STREAM,
            ...action.payload.props,
          };
        }
      }
      return {
        ...state,
        streams: [...state.streams],
      };

    case StreamsActionTypes.SET_NAVIGATION_STATE:
      return {
        ...state,
        ...(action.payload ? action.payload : {}),
      };

    case StreamsActionTypes.SET_STREAM_STATES_SUBSCRIPTION:
      return {
        ...state,
        dbState: action.payload.dbState,
      };

    default:
      return state;
  }
}
