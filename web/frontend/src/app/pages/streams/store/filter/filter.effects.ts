import { Injectable }              from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import * as FilterActions          from './filter.actions';
import { FilterActionTypes }       from './filter.actions';
import { map, switchMap, take }    from 'rxjs/operators';
import { select, Store }           from '@ngrx/store';
import { AppState }                from '../../../../core/store';
import { filterState }             from './filter.selectors';
import { State }                   from './filter.reducer';
import * as StreamsTabsActions     from '../streams-tabs/streams-tabs.actions';


@Injectable()
export class FilterEffects {
  // private destroy

  @Effect() loadFilters = this.actions$
    .pipe(
      ofType<FilterActions.AddFilters>(
        FilterActionTypes.SET_FILTER,
        FilterActionTypes.ADD_FILTER,
        FilterActionTypes.REMOVE_FILTER,
        FilterActionTypes.CLEAN_FILTER,
      ),
      switchMap(() => this.appStore.pipe(
        select(filterState),
        take(1),
      )),
      map((state: State) => {
        return new StreamsTabsActions.SetFilters({
          filter: state || {},
        });
        // if (state) {
        //   this.router.navigate([], {
        //     queryParams: {
        //       ...state,
        //     },
        //   });
        // } else {
        //   this.router.navigate([], {
        //     queryParams: null,
        //     replaceUrl: true,
        //   });
        // }
      }),
    );

  constructor(
    private actions$: Actions,
    private appStore: Store<AppState>,
    // private router: Router,
  ) {}
}
