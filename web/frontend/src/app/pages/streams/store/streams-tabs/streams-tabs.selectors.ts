import {createSelector} from '@ngrx/store';
import {FilterModel} from '../../models/filter.model';
import {TabModel} from '../../models/tab.model';
import {StreamsState, streamsStoreSelector} from '../index';
import * as fromTabs from './streams-tabs.reducer';

export const getTabsState = createSelector(
  streamsStoreSelector,
  (state: StreamsState) => state.tabs,
);

export const getTabs = createSelector(getTabsState, (state: fromTabs.State) => state.tabs);

export const getActiveTab = createSelector(getTabs, (tabs: TabModel[]) =>
  tabs.find((tab) => tab.active),
);

export const getActiveOrFirstTab = createSelector(getTabsState, (state: fromTabs.State) =>
  fromTabs.getActiveOrFirstTab(state.tabs),
);

export const getActiveTabFilters = createSelector(
  getActiveOrFirstTab,
  (tab: TabModel) => tab?.filter || null,
);

export const getLoadingState = createSelector(
  getActiveTabFilters,
  (filter: FilterModel) => !!filter?._isDataLoading,
);

export const getActiveTabSettings = createSelector(
  getActiveOrFirstTab,
  (tab: TabModel) => tab?.tabSettings || {},
);

export const needToShowOnCloseAlertTabs = createSelector(getTabs, (tabs: TabModel[]) =>
  tabs.filter((tab) => tab?.tabSettings?._showOnCloseAlerts),
);
