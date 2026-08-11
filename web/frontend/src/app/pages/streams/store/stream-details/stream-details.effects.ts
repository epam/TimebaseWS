import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Subject} from 'rxjs';
import {
  distinctUntilChanged,
  map,
  mergeMap,
  share,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {SchemaService} from '../../../../shared/services/schema.service';
import {StreamsService} from '../../../../shared/services/streams.service';
import {SymbolsService} from '../../../../shared/services/symbols.service';
import {TabModel} from '../../models/tab.model';
import {TabsService} from '../../services/tabs.service';
import * as FilterActions from '../filter/filter.actions';
import * as StreamDetailsActions from './stream-details.actions';
import {StreamDetailsActionTypes} from './stream-details.actions';

@Injectable()
export class StreamDetailsEffects {
   setSchema = createEffect(() => this.actions$.pipe(
    ofType<StreamDetailsActions.SetSchema>(StreamDetailsActionTypes.SET_SCHEMA),
    share(),
  ), {dispatch: false});
   cleanStreamData = createEffect(() => this.actions$.pipe(
    ofType<StreamDetailsActions.CleanStreamData>(StreamDetailsActionTypes.CLEAN_STREAM_DATA),
    share(),
  ), {dispatch: false});

   setSymbols = createEffect(() => this.actions$.pipe(
    ofType<StreamDetailsActions.SetSymbols>(StreamDetailsActionTypes.SET_SYMBOLS),
    share(),
  ), {dispatch: false});

   saveGlobalFilterState = createEffect(() => this.actions$.pipe(
    ofType<StreamDetailsActions.SaveGlobalFilterState>(
      StreamDetailsActionTypes.SAVE_GLOBAL_FILTER_STATE,
    ),
    map((action) => {
      if (action.payload.global_filter) {
        localStorage.setItem('global_filter', JSON.stringify(action.payload.global_filter));
      }
      return false;
    }),
    share(),
  ), {dispatch: false});
   setGlobalFilterState = createEffect(() => this.actions$.pipe(
    ofType<StreamDetailsActions.SetGlobalFilterState>(
      StreamDetailsActionTypes.SET_GLOBAL_FILTER_STATE,
    ),
    share(),
  ), {dispatch: false});

   clearGlobalFilterState = createEffect(() => this.actions$.pipe(
    ofType<StreamDetailsActions.ClearGlobalFilterState>(
      StreamDetailsActionTypes.CLEAR_GLOBAL_FILTER_STATE,
    ),
    map(() => {
      localStorage.setItem('global_filter', '');

      return false;
    }),
    share(),
  ), {dispatch: false});
   getStreamRange = createEffect(() => this.actions$.pipe(
    ofType<StreamDetailsActions.GetStreamRange>(StreamDetailsActionTypes.GET_STREAM_RANGE),
    switchMap((action) => {
      return this.streamsService
        .rangeCached(action.payload.streamId, action.payload.symbol, action.payload.spaceName, null, action.payload.tbId)
        .pipe(map((streamRange) => new StreamDetailsActions.SetStreamRange({streamRange})));
    }),
  ));
  private stop_subscription$ = new Subject();
   getSchema = createEffect(() => this.actions$.pipe(
    ofType<StreamDetailsActions.GetSchema>(StreamDetailsActionTypes.GET_SCHEMA),
    map((action) => action.payload),
    // distinctUntilChanged(),
    switchMap(({streamId, tbId}) => {
      return this.schemaService.getSchema(streamId, null, true, tbId).pipe(
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
  ));
   stopSubscriptions = createEffect(() => this.actions$.pipe(
    ofType(StreamDetailsActionTypes.STOP_SUBSCRIPTIONS),
    tap(() => {
      this.stop_subscription$.next(true);
      this.stop_subscription$.complete();
      this.stop_subscription$ = new Subject();
    }),
  ), {dispatch: false});
   getSymbols = createEffect(() => this.actions$.pipe(
    ofType<StreamDetailsActions.GetSymbols>(StreamDetailsActionTypes.GET_SYMBOLS),
    map((action) => action.payload),
    distinctUntilChanged(
      (e, prev) => `${e.streamId}-${e.spaceId}-${e.tbId}` === `${prev.streamId}-${prev.spaceId}-${prev.tbId}`,
    ),
    switchMap(({streamId, spaceId, tbId}) => {
      return this.symbolsService.getSymbols(streamId, spaceId, null, tbId).pipe(
        takeUntil(this.stop_subscription$),
        map((resp: Array<string>) => {
          return new StreamDetailsActions.SetSymbols({
            symbols: resp,
          });
        }),
      );
    }),
  ));
  private tabs_activated: boolean;
   subscribeTabChanges = createEffect(() => this.actions$.pipe(
    ofType<StreamDetailsActions.SubscribeTabChanges>(
      StreamDetailsActionTypes.SUBSCRIBE_TAB_CHANGES,
    ),
    switchMap(() =>
      this.tabsService.activeTabOfSimilarComponent().pipe(takeUntil(this.stop_subscription$)),
    ),
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
          tbId: activeTab.tbId,
        }),
      ];
    }),
  ));

  constructor(
    private actions$: Actions,
    private tabsService: TabsService,
    private schemaService: SchemaService,
    private symbolsService: SymbolsService,
    private streamsService: StreamsService,
  ) {}
}
