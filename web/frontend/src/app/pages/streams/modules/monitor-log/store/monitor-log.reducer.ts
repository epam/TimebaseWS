import { Action, createReducer } from '@ngrx/store';

export const monitorLogFeatureKey = 'monitorLog';

// tslint:disable-next-line:no-empty-interface
export interface State {
}

export const initialState: State = {};

const monitorLogReducer = createReducer(
  initialState,
  // on(MonitorLogActions.SetSelectedMessage, ((state, {selectedMessage}) => ({...state, selectedMessage}))),
  // on(MonitorLogActions.CleanSelectedMessage, ((state) => ({...state, selectedMessage: null}))),
);

export function reducer(state: State | undefined, action: Action) {
  return monitorLogReducer(state, action);
}
