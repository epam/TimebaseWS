import {Action} from '@ngrx/store';
import {PropsModel} from '../../models/props.model';

export enum StreamPropsActionTypes {
  GET_PROPS = '[StreamProps] Get Props',
  SET_PROPS = '[StreamProps] Set Props',
  CLEAR_PROPS = '[StreamProps] Clear Props',
  STOP_SUBSCRIPTIONS = '[StreamProps] Stop Subscriptions',
  CHANGE_STATE_PROPS = '[StreamProps] Change State Props',
}

export class GetProps implements Action {
  readonly type = StreamPropsActionTypes.GET_PROPS;
}

export class SetProps implements Action {
  readonly type = StreamPropsActionTypes.SET_PROPS;

  constructor(
    public payload: {
      props: PropsModel;
    },
  ) {}
}

export class ClearProps implements Action {
  readonly type = StreamPropsActionTypes.CLEAR_PROPS;
}

export class StopSubscriptions implements Action {
  readonly type = StreamPropsActionTypes.STOP_SUBSCRIPTIONS;
}

export class ChangeStateProps implements Action {
  readonly type = StreamPropsActionTypes.CHANGE_STATE_PROPS;

  constructor(
    public payload: {
      opened: boolean;
    },
  ) {}
}

export type StreamPropsActions =
  | GetProps
  | SetProps
  | ClearProps
  | StopSubscriptions
  | ChangeStateProps;
