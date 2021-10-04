import { Injectable }                                                                         from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { select, Store }                                                                      from '@ngrx/store';
import * as fromApp                                                                           from '../../store/app/app.reducer';
import * as fromAuth              from '../../store/auth/auth.reducer';
import { filter, map, switchMap }      from 'rxjs/operators';
import { getAuthState, getIsLoggedIn } from '../../store/auth/auth.selectors';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private appStore: Store<fromApp.State>,
    private router: Router,
  ) {
  }

  private checkLogin() {
    return this.appStore
      .pipe(
        select(getAuthState),
        filter((authState: fromAuth.State) => {
          return authState.tokenIsInitialized;
        }),
        switchMap(() => this.appStore.pipe(select(getIsLoggedIn))),
        map((getIsLoggedIn: boolean) => {
          if (!getIsLoggedIn) {
            this.router.navigate(['login']);
          }
          return getIsLoggedIn;
        }),
      );
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.checkLogin();
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.checkLogin();
  }
}
