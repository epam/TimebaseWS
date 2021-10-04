import { Action }      from '@ngrx/store';
import { FilterModel } from '../../models/filter.model';

export enum FilterActionTypes {
  ADD_FILTER = '[Filter] Add Filter',
  SET_FILTER = '[Filter] Set Filter',
  REMOVE_FILTER = '[Filter] Remove Filter',
  CLEAN_FILTER = '[Filter] Clean Filter',
  RESET_STATE = '[Filter] Reset State',
  
}

export class AddFilters implements Action {
  readonly type = FilterActionTypes.ADD_FILTER;
  
  constructor(public payload: {
    filter: { [key: string]: any },
  }) {}
}

export class SetFilters implements Action {
  readonly type = FilterActionTypes.SET_FILTER;
  
  constructor(public payload: {
    filter: FilterModel,
  }) {}
}

export class RemoveFilter implements Action {
  readonly type = FilterActionTypes.REMOVE_FILTER;
  
  constructor(public payload: {
    filterName: string,
  }) {}
}

export class CleanFilter implements Action {
  readonly type = FilterActionTypes.CLEAN_FILTER;
}

export class ResetState implements Action {
  readonly type = FilterActionTypes.RESET_STATE;
}

export type FilterActions =
  AddFilters |
  SetFilters |
  RemoveFilter |
  CleanFilter |
  ResetState;
