import {createFeatureSelector, createSelector} from '@ngrx/store';
import {selectedMessageFeatureKey, State} from './selected-message.reducer';

export const getSelectedMessageState = createFeatureSelector<State>(selectedMessageFeatureKey);

export const getSelectedMessage = createSelector(
  getSelectedMessageState,
  (state: State) => state.selectedMessage,
);

export const getSelectedMessageColumns = createSelector(
  getSelectedMessageState,
  (state: State) => state.columns,
);
