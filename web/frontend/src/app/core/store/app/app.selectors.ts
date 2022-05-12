import {RouterReducerState} from '@ngrx/router-store';
import {createFeatureSelector, createSelector} from '@ngrx/store';
import * as fromApp from './app.reducer';

export const getAppState = createFeatureSelector<fromApp.State>('appSelf');

export const getAppSettings = createSelector(getAppState, (state: fromApp.State) => state.settings);

export const getAppInfo = createSelector(getAppState, (state: fromApp.State) => state.appInfo);

export const getApiPrefix = createSelector(getAppState, (state: fromApp.State) => state.apiPrefix);

export const getAppVisibility = createSelector(
  getAppState,
  (state: fromApp.State) => state.app_is_visible,
);

export const getRouterState = createFeatureSelector('router');
export const getCurrentUrl = createSelector(getRouterState, (state: RouterReducerState) => {
  return state == null ? null : state.state && state.state.url;
});
