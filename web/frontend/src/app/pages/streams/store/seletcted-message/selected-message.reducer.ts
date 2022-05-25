import {Action, createReducer, on} from '@ngrx/store';
import {Column} from 'ag-grid-community';
import {StreamDetailsModel} from '../../models/stream.details.model';
import {CleanSelectedMessage, SetSelectedMessage} from './selected-message.actions';

export const selectedMessageFeatureKey = 'selectedMessage';

export interface State {
  selectedMessage: StreamDetailsModel;
  columns: Column[];
}

export const initialState: State = {
  selectedMessage: null,
  columns: [],
};

const selectedMessageReducer = createReducer(
  initialState,
  on(SetSelectedMessage, (state, {selectedMessage, columns}) => ({
    ...state,
    selectedMessage,
    columns,
  })),
  on(CleanSelectedMessage, (state) => ({...state, selectedMessage: null})),
);

export function reducer(state: State | undefined, action: Action) {
  return selectedMessageReducer(state, action);
}
