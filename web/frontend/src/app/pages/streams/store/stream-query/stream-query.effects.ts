import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {throwError} from 'rxjs';
import {catchError, map, share, switchMap, take} from 'rxjs/operators';
import * as NotificationsActions from '../../../../core/modules/notifications/store/notifications.actions';
import {AppState} from '../../../../core/store';
import {StreamDetailsModel} from '../../models/stream.details.model';
import * as StreamDetailsActions from '../stream-details/stream-details.actions';
import * as StreamQueryActions from './stream-query.actions';
import {StreamQueryActionTypes} from './stream-query.actions';

@Injectable()
export class StreamQueryEffects {
  @Effect() getStreamsQuery = this.actions$.pipe(
    ofType<StreamQueryActions.GetStreamsQuery>(StreamQueryActionTypes.GET_STREAMS_QUERY),
    switchMap((action) => {
      return this.httpClient

        .post<StreamDetailsModel[]>(`/query`, action.payload.query, {
          headers: {
            customError: 'true',
          },
        })
        .pipe(
          catchError((error) => {
            this.translate
              .get('notification_messages')
              .pipe(take(1))
              .subscribe((messages) => {
                this.appStore.dispatch(new StreamQueryActions.HideLoader());
                this.appStore.dispatch(
                  new NotificationsActions.AddAlert({
                    message:
                      error && error.error && error.error.message
                        ? `${error.error.message}` /* messages.network_error + (error && error.error && error.error.message ? `<br /> ${error.error.message}`*/
                        : messages.network_error,
                    dismissible: true,
                    closeInterval: 5000,
                  }),
                );
              });
            return throwError(error);
          }),
          map((resp) => {
            this.appStore.dispatch(new StreamQueryActions.HideLoader());
            return new StreamQueryActions.SetStreamsQuery({
              queryStreams: resp,
            });
          }),
        );
    }),
  );
  @Effect() getStreamsQueryDescribe = this.actions$.pipe(
    ofType<StreamQueryActions.GetStreamsQueryDescribe>(
      StreamQueryActionTypes.GET_STREAMS_QUERY_DESCRIBE,
    ),
    switchMap((action) => {
      return this.httpClient
        .post<StreamDetailsModel[]>(`/describe`, {query: action.payload.query})
        .pipe(
          map((resp) => {
            return new StreamDetailsActions.SetSchema({
              schema: resp['types'],
              schemaAll: resp['all'],
            });
          }),
        );
    }),
  );
  @Effect({dispatch: false}) clearStreamsQuery = this.actions$.pipe(
    ofType<StreamQueryActions.ClearStreamsQuery>(StreamQueryActionTypes.CLEAR_STREAMS_QUERY),
    share(),
  );
  @Effect({dispatch: false}) hideLoader = this.actions$.pipe(
    ofType<StreamQueryActions.HideLoader>(StreamQueryActionTypes.HIDE_LOADER),
    share(),
  );

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private appStore: Store<AppState>,
    private translate: TranslateService,
  ) {}
}
