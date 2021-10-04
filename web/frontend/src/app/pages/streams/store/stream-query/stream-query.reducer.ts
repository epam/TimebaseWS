import { StreamQueryActions, StreamQueryActionTypes } from './stream-query.actions';
import { AppState }                                   from '../../../../core/store';
import { StreamDetailsModel }                         from '../../models/stream.details.model';

export interface FeatureState extends AppState {
  streamQuery: State;
}

export interface State {
  streamQuery: StreamDetailsModel[];
}

export const initialState: State = {
  streamQuery: null,
};

export function reducer(state = initialState, action: StreamQueryActions): State {
  switch (action.type) {

    case StreamQueryActionTypes.SET_STREAMS_QUERY:
      return {
        ...state,
        streamQuery: action.payload.queryStreams,
      };

    case StreamQueryActionTypes.CLEAR_STREAMS_QUERY:
      return {
        ...state,
        streamQuery: null,
      };
    default:
      return state;
  }
}
