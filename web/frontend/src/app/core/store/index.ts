import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment }                   from '../../../environments/environment';
import * as fromApp                      from './app/app.reducer';
import * as fromAuth                     from './auth/auth.reducer';

import { routerReducer, RouterReducerState } from '@ngrx/router-store';

export interface AppState {
  appSelf: fromApp.State;
  auth: fromAuth.State;
  router: RouterReducerState;
}

export const reducers: ActionReducerMap<AppState> = {
  appSelf: fromApp.reducer,
  auth: fromAuth.reducer,
  router: routerReducer,
};


export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];
