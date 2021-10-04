import { Injectable, NgZone }      from '@angular/core';
import { Router }                  from '@angular/router';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store }           from '@ngrx/store';
import { fromEvent, Subject }      from 'rxjs';

import {
  concatMap,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
}                                 from 'rxjs/operators';
import { environment }            from '../../../../../environments/environment';
import { AppState }               from '../../../../core/store';
import { appRoute }               from '../../../../shared/utils/routes.names';
import { TabModel }               from '../../models/tab.model';
import * as StreamsTabsActions    from './streams-tabs.actions';
import { StreamsTabsActionTypes } from './streams-tabs.actions';
import * as fromTabs from './streams-tabs.reducer';
import { createTab } from './streams-tabs.reducer';
import { getTabs, getTabsState } from './streams-tabs.selectors';
import { TabStorageService } from '../../../../shared/services/tab-storage.service';


@Injectable()
export class StreamsTabsEffects {
  private stop_tabs_subscription$ = new Subject();

  constructor(
    private actions$: Actions,
    private appStore: Store<AppState>,
    private router: Router,
    private _ngZone: NgZone,
    private gridDataStorageService: TabStorageService<unknown>,
  ) {
  }

  @Effect() loadTabsFromLS = this.actions$
    .pipe(
      ofType(StreamsTabsActionTypes.LOAD_TABS_FROM_LS),
      mergeMap(() => {
        const tabsFromLS = localStorage.getItem(`${environment.config.version}_gridTabs`);
        return [
          new StreamsTabsActions.SetTabs({
            tabs: tabsFromLS ? JSON.parse(tabsFromLS) : [],
          }),
          new StreamsTabsActions.StartTabsLSSync(),
        ];
      }),
    );

  @Effect() startTabsLSSync = this.actions$
    .pipe(
      ofType(StreamsTabsActionTypes.START_TABS_LS_SYNC),
      switchMap(() => {
        return fromEvent(window, 'storage')
          .pipe(
            filter((resp: StorageEvent) => resp.key === `${environment.config.version}_gridTabs`),
            map((resp: StorageEvent) => resp.newValue),
            filter((newValue: string) => !!(newValue && newValue.length)),
            distinctUntilChanged(),
            map((newValue: string) => JSON.parse(newValue)),
            map((tabs: TabModel[]) => new StreamsTabsActions.SetTabs({
              tabs: tabs,
            })),
            takeUntil(this.stop_tabs_subscription$),
          );
      }),
    );

  @Effect({ dispatch: false }) stopTabsSync = this.actions$
    .pipe(
      ofType(StreamsTabsActionTypes.STOP_TABS_LS_SYNC),
      tap(() => {
        this.stop_tabs_subscription$.next(true);
        this.stop_tabs_subscription$.complete();
      }),
    );

  @Effect({ dispatch: false }) saveTabsToLS = this.actions$
    .pipe(
      ofType(
        StreamsTabsActionTypes.ADD_TAB,
        StreamsTabsActionTypes.REMOVE_TAB,
        StreamsTabsActionTypes.REMOVE_ALL_TABS,
        StreamsTabsActionTypes.REMOVE_STREAM_TABS,
        StreamsTabsActionTypes.REMOVE_SYMBOL_TABS,
        StreamsTabsActionTypes.SET_FILTER,
        StreamsTabsActionTypes.SET_TAB_SETTINGS,
      ),
      tap(() => getTabsState.release()),
      switchMap(() => this.appStore
        .pipe(
          select(getTabsState),
          take(1),
        )),
      tap((tabsState: fromTabs.State) => {
        window.localStorage.setItem(`${environment.config.version}_gridTabs`, JSON.stringify([...tabsState.tabs].map(tab => {
          tab = new TabModel({ ...tab, tabSettings: {...tab.tabSettings} });
          delete tab.active;
          if (tab.filter) delete tab.filter.silent;
          if (tab.tabSettings && tab.tabSettings._showOnCloseAlerts) delete tab.tabSettings._showOnCloseAlerts;
          return tab;
        })));
      }),
    );

  @Effect({ dispatch: false }) removeGridData = this.actions$.pipe(
    ofType<StreamsTabsActions.RemoveTab>(
      StreamsTabsActionTypes.REMOVE_TAB,
    ),
    concatMap(data => this.gridDataStorageService.removeData(data.payload.tab.id)),
  );

  @Effect({ dispatch: false }) removeAllGridData = this.actions$.pipe(
    ofType<StreamsTabsActions.RemoveTab>(
      StreamsTabsActionTypes.REMOVE_ALL_TABS,
    ),
    concatMap(() => this.gridDataStorageService.removeAllData()),
  );

  @Effect({ dispatch: false }) createTab = this.actions$
    .pipe(
      ofType<StreamsTabsActions.CreateTab>(StreamsTabsActionTypes.CREATE_TAB),
      withLatestFrom(this.appStore.pipe(select(getTabs))),
      tap(([action, tabs]: [StreamsTabsActions.CreateTab, TabModel[]]) => {
        const params = action.payload.params;
        const data = action.payload.data;
        const tab = createTab(tabs, new TabModel({
          ...params,
          ...data,
        }));

        if (tab.query || tab.flow) {
          tab.active = true;
          this.appStore.dispatch(new StreamsTabsActions.AddTab({
            tab: tab,
            position: tabs.length,
          }));
        }

        if (Object.keys(params).length) {
          this.router.navigate([appRoute, ...tab.linkArray], {
            queryParams: tab.linkQuery,
          });
        }
      }),
    );
}
