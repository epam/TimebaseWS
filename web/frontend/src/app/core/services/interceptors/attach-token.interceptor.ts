import {
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import {select, Store}                                               from '@ngrx/store';
import { Observable, throwError, timer, of }                                        from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import {AppState}                                                               from '../../store';
import * as AuthActions from '../../store/auth/auth.actions';
import {getAccessRequestData} from '../../store/auth/auth.selectors';

@Injectable()
export class AttachTokenInterceptor implements HttpInterceptor {
  constructor(private appStore: Store<AppState>, private actions$: Actions) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.appStore.pipe(
      select(getAccessRequestData),
      take(1),
      switchMap(({tokenRefreshTime, token, tokenType}) => {
        if (tokenRefreshTime && Date.now() - tokenRefreshTime > Math.round(299000 * 0.8)) {
          this.appStore.dispatch(new AuthActions.SilentUpdateToken());
          return this.actions$.pipe(
            ofType<AuthActions.TokenUpdated>(AuthActions.AuthActionTypes.TOKEN_UPDATED),
            switchMap(() => this.appStore.pipe(select(getAccessRequestData)))
          )
        } else {
          return of({token, tokenType});
        }
      }),
      switchMap(({token, tokenType}) => {
        const headers = {};
        req.headers.keys().forEach((key) => {
          headers[key] = req.headers.get(key);
        });
      
        const IGNORE_TOKEN = headers['ignoreToken'];
        delete headers['ignoreToken'];
      
        if (!IGNORE_TOKEN && token && token.length) {
          headers['Authorization'] = (tokenType ? tokenType : 'bearer') + ' ' + token;
        }
        
        const request = next.handle(req.clone({
          headers: new HttpHeaders(headers),
        }));
        
        return IGNORE_TOKEN ? request : request.pipe(catchError(error => {
          if (error.status !== 401) {
            return throwError(error);
          }
          
          timer().subscribe(() => this.appStore.dispatch(new AuthActions.SilentUpdateToken()));
          return this.appStore.pipe(
            select(getAccessRequestData),
            filter(data => data.token && token !== data.token),
            take(1),
            switchMap(() => this.intercept(req, next)),
          );
        }));
      }),
    );
  }
}
