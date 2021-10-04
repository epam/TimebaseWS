import { Action, createReducer, on } from '@ngrx/store';
import { StreamDetailsModel }                       from '../../models/stream.details.model';
import { CleanSelectedMessage, SetSelectedMessage } from './selected-message.actions';


export const selectedMessageFeatureKey = 'selectedMessage';

export interface State {
  selectedMessage: StreamDetailsModel;

}

export const initialState: State = {
  selectedMessage: null,

};

const selectedMessageReducer = createReducer(
  initialState,
  on(SetSelectedMessage, ((state, {selectedMessage}) => ({...state, selectedMessage}))),
  on(CleanSelectedMessage, ((state) => ({...state, selectedMessage: null}))),
);

export function reducer(state: State | undefined, action: Action) {
  return selectedMessageReducer(state, action);
}
