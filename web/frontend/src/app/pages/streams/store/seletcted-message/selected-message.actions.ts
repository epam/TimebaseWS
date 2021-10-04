import { createAction, props } from '@ngrx/store';
import { StreamDetailsModel }  from '../../models/stream.details.model';

export enum SelectedMessageActionTypes {

  SET_SELECTED_MESSAGE = '[SelectedMessage] Set Selected Message',
  CLEAN_SELECTED_MESSAGE = '[SelectedMessage] Clean Selected Message',
}

export const loadSelectedMessages = createAction(
  '[SelectedMessage] Load SelectedMessages',
);

export const loadSelectedMessagesSuccess = createAction(
  '[SelectedMessage] Load SelectedMessages Success',
  props<{ data: any }>(),
);

export const loadSelectedMessagesFailure = createAction(
  '[SelectedMessage] Load SelectedMessages Failure',
  props<{ error: any }>(),
);

export const SetSelectedMessage = createAction(
  SelectedMessageActionTypes.SET_SELECTED_MESSAGE,
  props<{ selectedMessage: StreamDetailsModel }>(),
);

export const CleanSelectedMessage = createAction(
  SelectedMessageActionTypes.CLEAN_SELECTED_MESSAGE,
);
