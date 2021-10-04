import { Params }           from '@angular/router';
import { Action }           from '@ngrx/store';
import { FilterModel }      from '../../models/filter.model';
import { TabModel }         from '../../models/tab.model';
import { TabSettingsModel } from '../../models/tab.settings.model';

export enum StreamsTabsActionTypes {
  SET_TABS = '[Streams:Tabs] Set Tabs',
  ADD_TAB = '[Streams:Tabs] Add Tab',
  RENAME_TAB = '[Streams:Tabs] Rename Tab',
  REMOVE_TAB = '[Streams:Tabs] Remove Tab',
  REMOVE_ALL_TABS = '[Streams:Tabs] Remove All Tabs',
  CREATE_TAB = '[Streams:Tabs] Create Tab',
  REMOVE_STREAM_TABS = '[Streams:Tabs] Remove Tabs by Stream',
  REMOVE_SYMBOL_TABS = '[Streams:Tabs] Remove Tabs by Symbol',

  LOAD_TABS_FROM_LS = '[Streams:Tabs] Start Tabs From LS',
  SAVE_TABS_TO_LS = '[Streams:Tabs] Save Tabs To LS',
  START_TABS_LS_SYNC = '[Streams:Tabs] Start Tabs LS Sync',
  STOP_TABS_LS_SYNC = '[Streams:Tabs] Stop Tabs LS Sync',

  ADD_FILTER = '[Streams:Tabs:Filter] Add Filter',
  SET_FILTER = '[Streams:Tabs:Filter] Set Filter',
  REMOVE_FILTER = '[Streams:Tabs:Filter] Remove Filter',
  CLEAN_FILTER = '[Streams:Tabs:Filter] Clean Filter',

  SET_TAB_SETTINGS = '[Streams:Tabs:Settings] Set Settings',
}

export class SetTabs implements Action {
  readonly type = StreamsTabsActionTypes.SET_TABS;

  constructor(public payload: {
    tabs?: TabModel[],
  }) {}
}

export class AddTab implements Action {
  readonly type = StreamsTabsActionTypes.ADD_TAB;

  constructor(public payload: {
    tab: TabModel,
    position?: number,
  }) {}
}

export class CreateTab implements Action {
  readonly type = StreamsTabsActionTypes.CREATE_TAB;

  constructor(public payload: {
    params: Params,
    data?: { [name: string]: any },
  }) {}
}

export class RemoveTab implements Action {
  readonly type = StreamsTabsActionTypes.REMOVE_TAB;

  constructor(public payload: {
    tab: TabModel,
  }) {}
}

export class RemoveAllTabs implements Action {
  readonly type = StreamsTabsActionTypes.REMOVE_ALL_TABS;
}

export class RemoveStreamTabs implements Action {
  readonly type = StreamsTabsActionTypes.REMOVE_STREAM_TABS;

  constructor(public payload: {
    streamKey: string,
    spaceName?: string,
  }) {}
}

export class RemoveSymbolTabs implements Action {
  readonly type = StreamsTabsActionTypes.REMOVE_SYMBOL_TABS;

  constructor(public payload: {
    streamId: string,
    symbolName: string,
  }) {}
}

export class LoadTabsFromLS implements Action {
  readonly type = StreamsTabsActionTypes.LOAD_TABS_FROM_LS;
}

export class SaveTabsToLS implements Action {
  readonly type = StreamsTabsActionTypes.SAVE_TABS_TO_LS;
}

export class StartTabsLSSync implements Action {
  readonly type = StreamsTabsActionTypes.START_TABS_LS_SYNC;
}

export class StopTabsSync implements Action {
  readonly type = StreamsTabsActionTypes.STOP_TABS_LS_SYNC;
}


export class AddFilters implements Action {
  readonly type = StreamsTabsActionTypes.ADD_FILTER;

  constructor(public payload: {
    filter: { [key: string]: any },
  }) {}
}

export class SetFilters implements Action {
  readonly type = StreamsTabsActionTypes.SET_FILTER;

  constructor(public payload: {
    filter: FilterModel,
  }) {}
}

export class RemoveFilter implements Action {
  readonly type = StreamsTabsActionTypes.REMOVE_FILTER;

  constructor(public payload: {
    filterName: string,
  }) {}
}

export class CleanFilter implements Action {
  readonly type = StreamsTabsActionTypes.CLEAN_FILTER;
}

export class SetTabSettings implements Action {
  readonly type = StreamsTabsActionTypes.SET_TAB_SETTINGS;

  constructor(public payload: {
    tabSettings: TabSettingsModel,
  }) {}
}

export type StreamsTabsActions =
  SetTabs |
  AddTab |
  RemoveTab |
  RemoveAllTabs |
  CreateTab |
  RemoveStreamTabs |
  RemoveSymbolTabs |
  LoadTabsFromLS |
  SaveTabsToLS |
  StartTabsLSSync |
  StopTabsSync |
  AddFilters |
  SetFilters |
  RemoveFilter |
  CleanFilter |
  SetTabSettings;
