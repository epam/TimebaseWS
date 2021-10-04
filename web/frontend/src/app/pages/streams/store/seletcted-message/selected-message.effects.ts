import { Injectable }                    from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store }                 from '@ngrx/store';
import { map, switchMap, take }          from 'rxjs/operators';
import { AppState }                      from '../../../../core/store';
import * as StreamsTabsActions           from '../streams-tabs/streams-tabs.actions';
import { getActiveTabSettings }          from '../streams-tabs/streams-tabs.selectors';
import * as SelectedMessageAction        from './selected-message.actions';


@Injectable()
export class SelectedMessageEffects {


  constructor(
    private actions$: Actions,
    private appStore: Store<AppState>,
  ) {}

  setSelectedMessage = createEffect(() => this.actions$
    .pipe(
      ofType(SelectedMessageAction.SetSelectedMessage),
      switchMap(() => this.appStore.pipe(
        select(getActiveTabSettings),
        take(1),
      )),
      map(tabSettings => {
        return new StreamsTabsActions.SetTabSettings({
          tabSettings: {
            ...tabSettings,
            showProps: false,
            showMessageInfo: true,
          },
        });
      }),
    ),
  );
  cleanSelectedMessage = createEffect(
    () => this.actions$.pipe(
      ofType(SelectedMessageAction.CleanSelectedMessage),
      switchMap(() => this.appStore.pipe(
        select(getActiveTabSettings),
        take(1),
      )),
      map(tabSettings => {
        return new StreamsTabsActions.SetTabSettings({
          tabSettings: {
            ...tabSettings,
            showMessageInfo: false,
          },
        });
      }),
    ),
  );
}
