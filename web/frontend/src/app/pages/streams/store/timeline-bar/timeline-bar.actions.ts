import { Action } from '@ngrx/store';

export enum TimelineBarActionTypes {
  SET_START_DATE = '[TimelineBar] Set Start Date',
  SET_END_DATE = '[TimelineBar] Set End Date',
  SET_FIRST_LOADED_DATE = '[TimelineBar] Set First Loaded Date',
  SET_LAST_LOADED_DATE = '[TimelineBar] Set Last Loaded Date',
  CLEAR_LOADED_DATES = '[TimelineBar] Clear Loaded Dates',
  
  RECALCULATE_THUMB_POSITIONS = '[TimelineBar] Recalculate Thumb Positions',
}

export class SetStartDate implements Action {
  readonly type = TimelineBarActionTypes.SET_START_DATE;
  
  constructor(public payload: {
    date: string,
  }) {}
}

export class SetEndDate implements Action {
  readonly type = TimelineBarActionTypes.SET_END_DATE;
  
  constructor(public payload: {
    date: string,
  }) {}
}

export class SetLastLoadedDate implements Action {
  readonly type = TimelineBarActionTypes.SET_LAST_LOADED_DATE;
  
  constructor(public payload: {
    date: string,
  }) {}
}

export class SetFirstLoadedDate implements Action {
  readonly type = TimelineBarActionTypes.SET_FIRST_LOADED_DATE;
  
  constructor(public payload: {
    date: string,
  }) {}
}

export class ClearLoadedDates implements Action {
  readonly type = TimelineBarActionTypes.CLEAR_LOADED_DATES;
}

export class RecalculateThumbPositions implements Action {
  readonly type = TimelineBarActionTypes.RECALCULATE_THUMB_POSITIONS;
}


export type TimelineBarActions =
  SetStartDate |
  SetEndDate |
  SetFirstLoadedDate |
  SetLastLoadedDate |
  ClearLoadedDates |
  RecalculateThumbPositions
  ;
