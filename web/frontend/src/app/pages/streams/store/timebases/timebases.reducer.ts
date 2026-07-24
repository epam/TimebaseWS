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

    default:
      return state;
  }
}
