import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
}                     from '@angular/router';
import { Store }      from '@ngrx/store';
import { Observable } from 'rxjs';
import * as fromApp   from '../../store';
import { map }        from 'rxjs/operators';

@Injectable()
export class AppInitGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    private appStore: Store<fromApp.AppState>,
    // private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.appStore.select('appSelf')
      .pipe(
        map((authState) => {
          return authState.app_init;
        }),
      );
  }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return this.appStore.select('appSelf')
      .pipe(
        map((authState) => {
          return authState.app_init;
        }),
      );
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.appStore.select('appSelf')
      .pipe(
        map((authState) => {
          return authState.app_init;
        }),
      );
  }


}
