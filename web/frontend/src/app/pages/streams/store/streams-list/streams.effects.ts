import {HttpClient, HttpResponse} from '@angular/common/http';
import {Injectable, NgZone} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';

import {TranslateService} from '@ngx-translate/core';
import {Observable, of, Subject} from 'rxjs';

import {
  catchError,
  concatMap,
  map,
  mergeMap,
  share,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';

import * as NotificationsActions from '../../../../core/modules/notifications/store/notifications.actions';
import {WSService} from '../../../../core/services/ws.service';
import {AppState} from '../../../../core/store';
import * as AppActions from '../../../../core/store/app/app.actions';
import {StreamsService} from '../../../../shared/services/streams.service';
import {StreamDescribeModel} from '../../models/stream.describe.model';
import {StreamsStateModel} from '../../models/streams.state.model';
import {SymbolModel} from '../../models/symbol.model';
import {StreamRenameService} from '../../services/stream-rename.service';
import * as StreamsTabsActions from '../streams-tabs/streams-tabs.actions';
import * as StreamsActions from './streams.actions';
import {StreamsActionTypes} from './streams.actions';
import * as fromStreams from './streams.reducer';

@Injectable({
  providedIn: 'root',
})
export class StreamsEffects {
  @Effect() getStreams = this.actions$.pipe(
    ofType<StreamsActions.GetStreams>(StreamsActionTypes.GET_STREAMS),
    switchMap((action) => {
      return this.streamsService
        .getList(false, action.payload.props?._filter, action.payload.props?._spaces)
        .pipe(map((streams) => new StreamsActions.SetStreams({streams: streams || []})));
    }),
  );
  @Effect() getSymbols = this.actions$.pipe(
    ofType<StreamsActions.GetSymbols>(StreamsActionTypes.GET_SYMBOLS),
    concatMap((action) => {
      const url = `/${encodeURIComponent(action.payload.streamKey)}/symbols`;
      return this.httpClient
        .get<string[]>(url, {
          params: {
            ...(action.payload?.props?._filter?.length
              ? {
                  filter: encodeURIComponent(action.payload.props._filter),
                }
              : {}),
            ...(typeof action.payload.spaceName === 'string'
              ? {
                  space: encodeURIComponent(action.payload.spaceName),
                }
              : {}),
          },
        })
        .pipe(
          map((resp) => {
            return new StreamsActions.SetSymbols({
              streamKey: action.payload.streamKey,
              symbols: resp,
              ...(typeof action.payload.spaceName === 'string'
                ? {spaceName: action.payload.spaceName}
                : {}),
            });
          }),
        );
    }),
  );
  @Effect() getSpaces = this.actions$.pipe(
    ofType<StreamsActions.GetSpaces>(StreamsActionTypes.GET_SPACES),
    concatMap((action) => {
      const url = `/${encodeURIComponent(action.payload.streamKey)}/spaces`;
      return this.httpClient
        .get(url, {
          headers: {
            customError: 'true',
          },
          ...(action.payload.props?._filter?.length
            ? {
                params: {filter: encodeURIComponent(action.payload.props._filter)},
              }
            : {}),
        })
        .pipe(
          map((resp: string[]) => {
            return resp?.length
              ? new StreamsActions.SetSpaces({
                  streamKey: action.payload.streamKey,
                  spaces: resp.map((spaceName) => ({name: spaceName})),
                })
              : new StreamsActions.GetSymbols({
                  streamKey: action.payload.streamKey,
                  ...(action.payload?.props._filter?.length
                    ? {
                        props: {_filter: encodeURIComponent(action.payload.props._filter)},
                      }
                    : {}),
                });
          }),
          catchError(() => {
            return of(
              new StreamsActions.GetSymbols({
                streamKey: action.payload.streamKey,
                ...(action.payload?.props._filter?.length
                  ? {
                      props: {_filter: encodeURIComponent(action.payload.props._filter)},
                    }
                  : {}),
              }),
            );
          }),
        );
    }),
  );
  @Effect() showStreamSymbols = this.actions$.pipe(
    ofType<StreamsActions.ShowStreamSymbols>(StreamsActionTypes.SHOW_STREAM_SYMBOLS),
    switchMap((action) => [
      new StreamsActions.SetStreamState({
        stream: action.payload.stream,
        props: {
          _shown: true,
        },
      }),
      new StreamsActions.GetSymbols({
        streamKey: action.payload.stream.key,
        props: action.payload.props,
        ...(typeof action.payload.spaceName === 'string'
          ? {spaceName: action.payload.spaceName}
          : {}),
      }),
    ]),
  );
  @Effect() showStreamSpaces = this.actions$.pipe(
    ofType<StreamsActions.ShowStreamSpaces>(StreamsActionTypes.SHOW_STREAM_SPACES),
    switchMap((action) => [
      new StreamsActions.SetStreamState({
        stream: action.payload.stream,
        props: {
          _shown: true,
        },
      }),
      new StreamsActions.GetSpaces({
        streamKey: action.payload.stream.key,
        props: action.payload.props,
      }),
    ]),
  );
  @Effect() truncateStream = this.actions$.pipe(
    ofType<StreamsActions.TruncateStream>(StreamsActionTypes.TRUNCATE_STREAM),
    switchMap((action) => {
      return this.httpClient
        .post<SymbolModel[]>(
          `${encodeURIComponent(action.payload.streamKey)}/truncate`,
          action.payload.params,
        )
        .pipe(
          switchMap(() => this.translate.get('notification_messages')),
          mergeMap((messages) => {
            return [
              new NotificationsActions.AddNotification({
                message: messages.stream_truncated_succeeded,
                dismissible: true,
                closeInterval: 2000,
                type: 'success',
              }),
              new StreamsActions.CloseModal(),
            ];
          }),
        );
    }),
  );
  @Effect() purgeStream = this.actions$.pipe(
    ofType<StreamsActions.PurgeStream>(StreamsActionTypes.PURGE_STREAM),
    switchMap((action) => {
      return this.httpClient
        .post<SymbolModel[]>(
          `${encodeURIComponent(action.payload.streamKey)}/purge`,
          action.payload.params,
        )
        .pipe(
          switchMap(() => this.translate.get('notification_messages')),
          mergeMap((messages) => {
            return [
              new NotificationsActions.AddNotification({
                message: messages.stream_purged_succeeded,
                dismissible: true,
                closeInterval: 2000,
                type: 'success',
              }),
              new StreamsActions.CloseModal(),
            ];
          }),
        );
    }),
  );
  @Effect() getStreamDescribe = this.actions$.pipe(
    ofType<StreamsActions.GetStreamDescribe>(StreamsActionTypes.GET_STREAM_DESCRIBE),
    switchMap((action) => {
      return this.httpClient
        .get<StreamDescribeModel>(`${encodeURIComponent(action.payload.streamId)}/describe`)
        .pipe(
          map((resp) => {
            return new StreamsActions.SetStreamDescribe({describe: resp});
          }),
        );
    }),
  );
  @Effect() deleteStream = this.actions$.pipe(
    ofType<StreamsActions.AskToDeleteStream>(StreamsActionTypes.ASK_TO_DELETE_STREAM),
    switchMap((action) => {
      let url = '/delete';
      if (action.payload.spaceName) {
        url = '/deleteSpace';
      }
      return (
        action.payload.spaceName
          ? this.httpClient.get(`${encodeURIComponent(action.payload.streamKey)}${url}`, {
              ...(action.payload.spaceName
                ? {
                    // headers: {
                    //   'Content-Type': 'application/json',
                    // },
                    params: {
                      space: action.payload.spaceName,
                    },
                  }
                : {}),
            })
          : this.httpClient.post(`${encodeURIComponent(action.payload.streamKey)}${url}`, {})
      ).pipe(
        switchMap(() => this.translate.get('notification_messages')),
        mergeMap((messages) => {
          return [
            new NotificationsActions.AddNotification({
              message: action.payload.spaceName
                ? messages.spaceDeletedSucceeded
                : messages.streamDeletedSucceeded,
              dismissible: true,
              closeInterval: 2000,
              type: 'success',
            }),
            ...(action.payload.spaceName
              ? [
                  new StreamsActions.SetStreamStatesSubscription({
                    dbState: {
                      deleted: [
                        {
                          streamId: action.payload.streamKey,
                          space: action.payload.spaceName,
                        },
                      ],
                    },
                  }),
                ]
              : []),
          ];
        }),
      );
    }),
  );
  @Effect() askToRenameStream = this.actions$.pipe(
    ofType<StreamsActions.AskToRenameStream>(StreamsActionTypes.ASK_TO_RENAME_STREAM),
    switchMap((action) => {
      const data = new FormData();
      let url = '/rename';
      if (!action.payload.spaceName) {
        data.append('newStreamId', action.payload.newName);
      } else {
        url = '/renameSpace';
      }
      return (
        action.payload.spaceName
          ? this.httpClient.get(`${encodeURIComponent(action.payload.streamId)}${url}`, {
              ...(action.payload.spaceName
                ? {
                    params: {
                      space: action.payload.spaceName,
                      newName: action.payload.newName,
                    },
                  }
                : {}),
            })
          : this.httpClient.post(`${encodeURIComponent(action.payload.streamId)}${url}`, data)
      ).pipe(
        switchMap(() => this.translate.get('notification_messages')),
        tap(() => {
          const p = action.payload;
          if (p.spaceName) {
            this.streamRenameService.spaceRenamed(p.streamId, p.spaceName, p.newName);
          }
        }),
        mergeMap((messages) => {
          return [
            new NotificationsActions.AddNotification({
              message: action.payload.spaceName
                ? messages.spaceRenameSucceeded
                : messages.streamRenameSucceeded,
              dismissible: true,
              closeInterval: 2000,
              type: 'success',
            }),
            ...(action.payload.spaceName
              ? [
                  new StreamsActions.SetStreamStatesSubscription({
                    dbState: {
                      renamed: [
                        {
                          streamId: action.payload.streamId,
                          oldName: action.payload.spaceName,
                          newName: action.payload.newName,
                        },
                      ],
                    },
                  }),
                ]
              : []),
          ];
        }),
      );
    }),
  );
  @Effect() askToRenameSymbol = this.actions$.pipe(
    ofType<StreamsActions.AskToRenameSymbol>(StreamsActionTypes.ASK_TO_RENAME_SYMBOL),
    switchMap((action) => {
      const data = new FormData();
      data.append('newSymbol', action.payload.newSymbolName);
      return this.httpClient
        .post(
          `${encodeURIComponent(action.payload.streamId)}/${encodeURIComponent(
            action.payload.oldSymbolName,
          )}/rename`,
          data,
        )
        .pipe(
          tap(() =>
            this.streamRenameService.symbolRenamed(
              action.payload.streamId,
              action.payload.oldSymbolName,
              action.payload.newSymbolName,
            ),
          ),
          switchMap(() => this.translate.get('notification_messages')),
          mergeMap((messages) => {
            return [
              new NotificationsActions.AddNotification({
                message: messages.symbolRenameSucceeded,
                dismissible: true,
                closeInterval: 2000,
                type: 'success',
              }),
            ];
          }),
        );
    }),
  );
  @Effect({dispatch: false}) closeModal = this.actions$.pipe(
    ofType<StreamsActions.CloseModal>(StreamsActionTypes.CLOSE_MODAL),
    share(),
  );
  @Effect({dispatch: false}) setStreamStatesSubscription = this.actions$.pipe(
    ofType<StreamsActions.SetStreamStatesSubscription>(
      StreamsActionTypes.SET_STREAM_STATES_SUBSCRIPTION,
    ),
    map((action) => action.payload.dbState),
    tap((new_dbState: StreamsStateModel) => {
      if (new_dbState.deleted && new_dbState.deleted.length) {
        new_dbState.deleted.forEach((deletedItem) => {
          if (typeof deletedItem === 'string') {
            this.appStore.dispatch(
              new StreamsActions.DeleteStream({
                streamKey: deletedItem,
              }),
            );
            this.appStore.dispatch(
              new StreamsTabsActions.RemoveStreamTabs({
                streamKey: deletedItem,
              }),
            );
          } else if (typeof deletedItem === 'object') {
            this.appStore.dispatch(
              new StreamsActions.DeleteStream({
                streamKey: deletedItem.streamId,
                spaceName: deletedItem.space,
              }),
            );
            this.appStore.dispatch(
              new StreamsTabsActions.RemoveStreamTabs({
                streamKey: deletedItem.streamId,
                spaceName: deletedItem.space,
              }),
            );
          }
        });
      }
      if (new_dbState.added && new_dbState.added.length) {
        this.streamsStore.dispatch(new StreamsActions.GetStreams({}));
      }
    }),
  );
  @Effect() downloadQSMSGFile = this.actions$.pipe(
    ofType<StreamsActions.DownloadQSMSGFile>(StreamsActionTypes.DOWNLOAD_QSMSG_FILE),
    switchMap((action) => {
      return this.httpClient
        .get(`/${action.payload.streamId}/export`, {
          observe: 'response',
          responseType: 'arraybuffer',
        })
        .pipe(
          map((resp: HttpResponse<any>) => {
            const CONTENT_HEADER = resp.headers
              .get('content-disposition')
              .replace('attachment;filename=', '');
            return new AppActions.OfferToSaveFile({
              data: resp.body,
              fileType: resp.headers.get('content-type'),
              fileName: CONTENT_HEADER,
            });
          }),
        );
    }),
  );
  @Effect() sendMessage = this.actions$.pipe(
    ofType<StreamsActions.SendMessage>(StreamsActionTypes.SEND_MESSAGE),
    switchMap((action) => {
      return this.httpClient
        .post(`/${encodeURIComponent(action.payload.streamId)}/write`, action.payload.messages, {
          params: {writeMode: action.payload.writeMode},
        })
        .pipe(
          switchMap(() => this.translate.get('notification_messages')),
          mergeMap((messages) => {
            return [
              new NotificationsActions.AddNotification({
                message: messages.sendMessageSucceeded,
                dismissible: true,
                closeInterval: 2000,
                type: 'success',
              }),
            ];
          }),
        );
    }),
  );
  private stop_streams_state_subscription$ = new Subject();
  @Effect() addStreamStatesSubscription = this.actions$.pipe(
    ofType<StreamsActions.AddStreamStatesSubscription>(
      StreamsActionTypes.ADD_STREAM_STATES_SUBSCRIPTION,
    ),
    switchMap(() => {
      return this._ngZone.runOutsideAngular<Observable<any>>(() => {
        return this.wsService.watch(`/topic/streams`).pipe(
          map((ws_message) => JSON.parse(ws_message.body)),
          takeUntil(this.stop_streams_state_subscription$),
          map((data: StreamsStateModel) => {
            if (
              (data.renamed && data.renamed.length) ||
              (data.deleted && data.deleted.length) ||
              (data.added && data.added.length)
            ) {
              // TODO: Rewrite this part to interact with changed state
              this.streamsStore.dispatch(
                new StreamsActions.SetStreamStatesSubscription({dbState: data}),
              );
            }
            return {
              type: `STREAM_STATES_MESSAGE_${data.messageType}`,
              payload: data,
            };
          }),
        );
      });
    }),
  );
  @Effect({dispatch: false}) stopStreamStatesSubscription = this.actions$.pipe(
    ofType<StreamsActions.StopStreamStatesSubscription>(
      StreamsActionTypes.STOP_STREAM_STATES_SUBSCRIPTION,
    ),
    tap(() => {
      this.stop_streams_state_subscription$.next(true);
      this.stop_streams_state_subscription$.complete();
    }),
  );

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private streamsStore: Store<fromStreams.FeatureState>,
    private translate: TranslateService,
    private appStore: Store<AppState>,
    private wsService: WSService,
    private streamsService: StreamsService,
    private _ngZone: NgZone,
    private streamRenameService: StreamRenameService,
  ) {}
}
