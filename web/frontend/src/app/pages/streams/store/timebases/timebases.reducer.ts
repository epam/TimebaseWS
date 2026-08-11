import {TimebaseInstanceDef} from '../../../../shared/models/timebase-instance-def.model';
import {TimebasesActions, TimebasesActionTypes} from './timebases.actions';

export interface State {
  timebases: TimebaseInstanceDef[];
  loaded: boolean;
}

export const initialState: State = {
  timebases: [],
  loaded: false,
};

export function reducer(state = initialState, action: TimebasesActions): State {
  switch (action.type) {
    case TimebasesActionTypes.SET_TIMEBASES:
      return {
        ...state,
        timebases: action.payload.timebases,
        loaded: true,
      };

    case TimebasesActionTypes.TIMEBASE_STATUS_CHANGED:
      return {
        ...state,
        timebases: state.timebases.map((tb) =>
          tb.id === action.payload.id
            ? {...tb, connected: action.payload.connected, errorMessage: action.payload.errorMessage}
            : tb,
        ),
      };

    default:
      return state;
  }
}
