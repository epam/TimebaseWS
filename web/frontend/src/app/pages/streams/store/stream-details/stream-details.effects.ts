import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import * as Diff from 'fast-deep-equal';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, mergeMap, share, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { AppState } from '../../../../core/store';
import { TabModel } from '../../models/tab.model';
import * as FilterActions
  from '../filter/filter.actions';
import { getActiveTab, getTabsState } from '../streams-tabs/streams-tabs.selectors';
import * as StreamDetailsActions
  from './stream-details.actions';
import { StreamDetailsActionTypes } from './stream-details.actions';
import { TabsService } from '../../services/tabs.service';
import { SchemaService } from '../../../../shared/services/schema.service';
import { SymbolsService } from '../../../../shared/services/symbols.service';
import { StreamsService } from '../../../../shared/services/streams.service';

@Injectable()
export class StreamDetailsEffects {
  @Effect({ dispatch: false }) setSchema = this.actions$
    .pipe(
      ofType<StreamDetailsActions.SetSchema>(StreamDetailsActionTypes.SET_SCHEMA),
      share(),
    );
  @Effect({ dispatch: false }) cleanStreamData = this.actions$
    .pipe(
      ofType<StreamDetailsActions.CleanStreamData>(StreamDetailsActionTypes.CLEAN_STREAM_DATA),
      share(),
    );

  @Effect({ dispatch: false }) setSymbols = this.actions$
    .pipe(
      ofType<StreamDetailsActions.SetSymbols>(StreamDetailsActionTypes.SET_SYMBOLS),
      share(),
    );

  @Effect({ dispatch: false }) saveGlobalFilterState = this.actions$
    .pipe(
      ofType<StreamDetailsActions.SaveGlobalFilterState>(StreamDetailsActionTypes.SAVE_GLOBAL_FILTER_STATE),
      map(action => {
        if (action.payload.global_filter) {
          localStorage.setItem('global_filter', JSON.stringify(action.payload.global_filter));
        }
        return false;
      }),
      share(),
    );
  @Effect({ dispatch: false }) setGlobalFilterState = this.actions$
    .pipe(
      ofType<StreamDetailsActions.SetGlobalFilterState>(StreamDetailsActionTypes.SET_GLOBAL_FILTER_STATE),
      share(),
    );

  @Effect({ dispatch: false }) clearGlobalFilterState = this.actions$
    .pipe(
      ofType<StreamDetailsActions.ClearGlobalFilterState>(StreamDetailsActionTypes.CLEAR_GLOBAL_FILTER_STATE),
      map(() => {
          localStorage.setItem('global_filter', '');

          return false;
        },
      ),
      share(),
    );

  private stop_subscription$ = new Subject();
  @Effect() getSchema = this.actions$
    .pipe(
      ofType<StreamDetailsActions.GetSchema>(StreamDetailsActionTypes.GET_SCHEMA),
      map(action => action.payload.streamId),
      // distinctUntilChanged(),
      switchMap(streamId => {
        return this.schemaService.getSchema(streamId)
          .pipe(
            takeUntil(this.stop_subscription$),
            map((resp) => {
              let schemaTypes = [];
              let schemaAll = [];

              if (resp) {
                if (resp['types']) {
                  schemaTypes = resp['types'];
                }
                if (resp['all']) {
                  schemaAll = resp['all'];
                }
              }
              return new StreamDetailsActions.SetSchema({
                schema: schemaTypes,
                schemaAll: schemaAll,
              });
            }),
          );
      }),
    );
  @Effect({ dispatch: false }) stopSubscriptions = this.actions$
    .pipe(
      ofType(StreamDetailsActionTypes.STOP_SUBSCRIPTIONS),
      tap(() => {
        this.stop_subscription$.next(true);
        this.stop_subscription$.complete();
        this.stop_subscription$ = new Subject();
      }),
    );
  @Effect() getSymbols = this.actions$
    .pipe(
      ofType<StreamDetailsActions.GetSymbols>(StreamDetailsActionTypes.GET_SYMBOLS),
      map(action => action.payload),
      distinctUntilChanged((e, prev) => `${e.streamId}-${e.spaceId}` === `${prev.streamId}-${prev.spaceId}`),
      switchMap(({ streamId, spaceId }) => {
        return this.symbolsService.getSymbols(streamId, spaceId)
          .pipe(
            takeUntil(this.stop_subscription$),
            map((resp: Array<string>) => {
              return new StreamDetailsActions.SetSymbols({
                symbols: resp,
              });
            }),
          );
      }),
    );
  private tabs_activated: boolean;
  @Effect() subscribeTabChanges = this.actions$
    .pipe(
      ofType<StreamDetailsActions.SubscribeTabChanges>(StreamDetailsActionTypes.SUBSCRIBE_TAB_CHANGES),
      switchMap(() => this.tabsService.activeTabOfSimilarComponent().pipe(takeUntil(this.stop_subscription$))),
      mergeMap((activeTab: TabModel) => {
        const reset_tabs = [];
        if (this.tabs_activated) {
          reset_tabs.push(new FilterActions.ResetState());
        } else {
          this.tabs_activated = true;
        }

        return [
          ...reset_tabs,
          new StreamDetailsActions.CleanStreamData(),
          new StreamDetailsActions.GetSchema({
            streamId: activeTab.stream,
          }),
        ];
      }),
    );

  @Effect() getStreamRange = this.actions$
    .pipe(
      ofType<StreamDetailsActions.GetStreamRange>(StreamDetailsActionTypes.GET_STREAM_RANGE),
      switchMap((action) => {
        return this.streamsService.range(action.payload.streamId, action.payload.symbol, action.payload.spaceName)
          .pipe(map((streamRange) => new StreamDetailsActions.SetStreamRange({ streamRange })));
      }),
    );


  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private tabsService: TabsService,
    private schemaService: SchemaService,
    private symbolsService: SymbolsService,
    private streamsService: StreamsService,
  ) {
  }
}
