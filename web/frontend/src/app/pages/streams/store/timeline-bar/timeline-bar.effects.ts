import { Injectable }              from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import * as TimelineBarActions     from './timeline-bar.actions';
import { TimelineBarActionTypes }  from './timeline-bar.actions';
import { debounce, map }           from 'rxjs/operators';
import { interval }                from 'rxjs';


@Injectable()
export class TimelineBarEffects {
  
  @Effect() recalculateThumbPositions = this.actions$
    .pipe(
      ofType(
        TimelineBarActionTypes.SET_START_DATE,
        TimelineBarActionTypes.SET_END_DATE,
        TimelineBarActionTypes.SET_FIRST_LOADED_DATE,
        TimelineBarActionTypes.SET_LAST_LOADED_DATE,
        TimelineBarActionTypes.CLEAR_LOADED_DATES,
      ),
      debounce(() => interval(500)),
      map(() => new TimelineBarActions.RecalculateThumbPositions()),
    );
  
  constructor(private actions$: Actions) {}
}
