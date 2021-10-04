import { Injectable }                                                       from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { select, Store }                                                    from '@ngrx/store';
import * as fromApp                                                         from '../../store/app/app.reducer';
import { filter, map, switchMap }                                           from 'rxjs/operators';
import { getIsLoggedIn, getIsTokenInitialized }                             from '../../store/auth/auth.selectors';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(
    private appStore: Store<fromApp.State>,
    private router: Router,
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.appStore
      .pipe(
        select(getIsTokenInitialized),
        filter(isTokenInitialized => isTokenInitialized),
        switchMap(() => this.appStore.pipe(select(getIsLoggedIn))),
        map((getIsLoggedIn: boolean) => {
          if (!getIsLoggedIn) {
            return true;
          }
          this.router.navigate(['/']);
          return false;
        }),
      );
  }
}
