import {HttpClient} from '@angular/common/http';

import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
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
   getProps = createEffect(() => this.actions$.pipe(
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
  ));
   stopSubscriptions = createEffect(() => this.actions$.pipe(
    ofType<StreamPropsActions.StopSubscriptions>(StreamPropsActionTypes.STOP_SUBSCRIPTIONS),
    tap(() => {
      this.stop_subscription$.next(true);
      this.stop_subscription$.complete();
      this.stop_subscription$ = new Subject();
    }),
  ), {dispatch: false});
  private changed_props_state$ = new Subject();
   changeStateProps = createEffect(() => this.actions$.pipe(
    ofType<StreamPropsActions.ChangeStateProps>(StreamPropsActionTypes.CHANGE_STATE_PROPS),
    tap(() => {
      this.changed_props_state$.next(true);
      this.changed_props_state$.complete();
      this.changed_props_state$ = new Subject();
    }),
  ), {dispatch: false});

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private tabsService: TabsService,
  ) {}
}
