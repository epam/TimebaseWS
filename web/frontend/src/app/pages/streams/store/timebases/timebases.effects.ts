import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {catchError, map, mergeMap, switchMap} from 'rxjs/operators';
import {of} from 'rxjs';
import {TimebasesService} from '../../../../shared/services/timebases.service';
import {WSService} from '../../../../core/services/ws.service';
import * as NotificationsActions from '../../../../core/modules/notifications/store/notifications.actions';
import * as TimebasesActions from './timebases.actions';
import {TimebasesActionTypes} from './timebases.actions';

interface TimebaseStatusEvent {
  id: string;
  connected: boolean;
  errorMessage?: string;
}

@Injectable()
export class TimebasesEffects {
  loadTimebases = createEffect(() =>
    this.actions$.pipe(
      ofType<TimebasesActions.LoadTimebases>(TimebasesActionTypes.LOAD_TIMEBASES),
      switchMap(() =>
        this.timebasesService.getTimebases().pipe(
          map((timebases) => new TimebasesActions.SetTimebases({timebases})),
          catchError((error) => of(new TimebasesActions.LoadTimebasesFailed({error}))),
        ),
      ),
    ),
  );

  timebaseStatusChanged = createEffect(() =>
    this.wsService.watchObject<TimebaseStatusEvent>('/topic/timebase-status').pipe(
      mergeMap((event) => {
        const statusAction = new TimebasesActions.TimebaseStatusChanged(event);
        const alias = `timebase-status-${event.id}`;

        return event.connected
          ? [
              statusAction,
              new NotificationsActions.RemoveWarnByAlias(alias),
              new NotificationsActions.AddNotification({
                type: 'success',
                message: `Timebase "${event.id}" is available again`,
                dismissible: true,
                closeInterval: 4000,
                alias,
              }),
            ]
          : [
              statusAction,
              new NotificationsActions.AddWarn({
                type: 'warning',
                message: `Timebase "${event.id}" is unavailable${event.errorMessage ? ': ' + event.errorMessage : ''}`,
                dismissible: true,
                alias,
              }),
            ];
      }),
    ),
  );

  constructor(
    private actions$: Actions,
    private timebasesService: TimebasesService,
    private wsService: WSService,
  ) {}
}
