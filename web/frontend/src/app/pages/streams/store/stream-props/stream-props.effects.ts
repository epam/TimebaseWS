import {HttpClient} from '@angular/common/http';

import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Subject} from 'rxjs';
import {mergeMap, switchMap, takeUntil, tap} from 'rxjs/operators';
import {PropsModel} from '../../models/props.model';
import {TabModel} from '../../models/tab.model';
import {TabsService} from '../../services/tabs.service';
import * as StreamPropsActions from './stream-props.actions';
import {StreamPropsActionTypes} from './stream-props.actions';

@Injectable()
export class StreamPropsEffects {
  private stop_subscription$ = new Subject();
  @Effect() getProps = this.actions$.pipe(
    ofType<StreamPropsActions.GetProps>(StreamPropsActionTypes.GET_PROPS),
    switchMap(() => this.tabsService.activeTabOfSimilarComponent()),
    switchMap((activeTab: TabModel) => {
      return this.httpClient
        .get<PropsModel>(`/${encodeURIComponent(activeTab.stream)}/options`, {
          headers: {customError: 'true'},
        })
        .pipe(
          takeUntil(this.stop_subscription$),
          mergeMap((resp) => [new StreamPropsActions.SetProps({props: resp || null})]),
        );
    }),
  );
  @Effect({dispatch: false}) stopSubscriptions = this.actions$.pipe(
    ofType<StreamPropsActions.StopSubscriptions>(StreamPropsActionTypes.STOP_SUBSCRIPTIONS),
    tap(() => {
      this.stop_subscription$.next(true);
      this.stop_subscription$.complete();
      this.stop_subscription$ = new Subject();
    }),
  );
  private changed_props_state$ = new Subject();
  @Effect({dispatch: false}) changeStateProps = this.actions$.pipe(
    ofType<StreamPropsActions.ChangeStateProps>(StreamPropsActionTypes.CHANGE_STATE_PROPS),
    tap(() => {
      this.changed_props_state$.next(true);
      this.changed_props_state$.complete();
      this.changed_props_state$ = new Subject();
    }),
  );

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private tabsService: TabsService,
  ) {}
}
