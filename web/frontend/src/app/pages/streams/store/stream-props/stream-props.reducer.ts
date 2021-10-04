import { AppState }                                   from '../../../../core/store';
import { PropsModel }                                 from '../../models/props.model';
import { StreamPropsActions, StreamPropsActionTypes } from './stream-props.actions';

export interface FeatureState extends AppState {
  streamProps: State;
}

export interface State {
  props: PropsModel;
  opened: boolean;
}

export const initialState: State = {
  props: null,
  opened: false,
};


export function reducer(state = initialState, action: StreamPropsActions): State {
  switch (action.type) {
    case StreamPropsActionTypes.SET_PROPS:
      return {
        ...state,
        props: action['payload'].props,
      };
    case StreamPropsActionTypes.CLEAR_PROPS:
      return {
        ...state,
        props: null,
      };
    case StreamPropsActionTypes.CHANGE_STATE_PROPS:
      return {
        ...state,
        opened: action['payload'].opened,
      };
    default:
      return state;
  }
}
