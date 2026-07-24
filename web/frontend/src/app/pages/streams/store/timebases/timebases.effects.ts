import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {catchError, map, switchMap} from 'rxjs/operators';
import {of} from 'rxjs';
import {TimebasesService} from '../../../../shared/services/timebases.service';
import * as TimebasesActions from './timebases.actions';
import {TimebasesActionTypes} from './timebases.actions';

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

  constructor(
    private actions$: Actions,
    private timebasesService: TimebasesService,
  ) {}
}
