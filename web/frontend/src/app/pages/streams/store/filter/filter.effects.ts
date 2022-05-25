import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {select, Store} from '@ngrx/store';
import {map, switchMap, take} from 'rxjs/operators';
import {AppState} from '../../../../core/store';
import * as StreamsTabsActions from '../streams-tabs/streams-tabs.actions';
import * as FilterActions from './filter.actions';
import {FilterActionTypes} from './filter.actions';
import {State} from './filter.reducer';
import {filterState} from './filter.selectors';

@Injectable()
export class FilterEffects {
  // private destroy

  @Effect() loadFilters = this.actions$.pipe(
    ofType<FilterActions.AddFilters>(
      FilterActionTypes.SET_FILTER,
      FilterActionTypes.ADD_FILTER,
      FilterActionTypes.REMOVE_FILTER,
      FilterActionTypes.CLEAN_FILTER,
    ),
    switchMap(() => this.appStore.pipe(select(filterState), take(1))),
    map((state: State) => {
      return new StreamsTabsActions.SetFilters({
        filter: state || {},
      });
    }),
  );

  constructor(
    private actions$: Actions,
    private appStore: Store<AppState>, // private router: Router,
  ) {}
}
