import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { select, Store }                                                     from '@ngrx/store';
import { AppState }                                                          from '../../store';
import { Observable, throwError }                                            from 'rxjs';
import { Injectable }                                                        from '@angular/core';
import { catchError, filter, switchMap, take }                               from 'rxjs/operators';
import { getAccessRequestData }                                              from '../../store/auth/auth.selectors';
import * as AuthActions                                                      from '../../store/auth/auth.actions';
import { getAppState }                                                       from '../../store/app/app.selectors';

@Injectable()
export class AttachTokenInterceptor implements HttpInterceptor {
  constructor(
    private appStore: Store<AppState>,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.appStore
      .pipe(
        select(getAccessRequestData),
        take(1),
        switchMap(({token, tokenType}) => {
          const headers = {};
          req.headers.keys().forEach(key => {
            headers[key] = req.headers.get(key);
          });

          const IGNORE_TOKEN = headers['ignoreToken'];
          delete headers['ignoreToken'];

          if (!IGNORE_TOKEN && (token && token.length)) {
            headers['Authorization'] = (tokenType ? tokenType : 'bearer') + ' ' + token;
          }
          const request = next
            .handle(req.clone({
              headers: new HttpHeaders(headers),
            }));

          if (!IGNORE_TOKEN) {
            return request.pipe(
              catchError((error) => {
                if (error.status === 401) {
                  this.appStore.dispatch(new AuthActions.SilentUpdateToken());
                  return this.appStore
                    .pipe(
                      select(getAppState),
                      filter(appState => !appState.preventRequests),
                      take(1),
                      switchMap(() => this.appStore.pipe(select(getAccessRequestData))),
                      filter(({token, tokenType}) => !!token),
                      take(1),
                      switchMap(({token, tokenType}) => {
                        const new_headers = {};
                        req.headers.keys().forEach(key => {
                          new_headers[key] = req.headers.get(key);
                        });

                        const IGNORE_TOKEN = new_headers['ignoreToken'];
                        delete new_headers['ignoreToken'];

                        if (!IGNORE_TOKEN && (token && token.length)) {
                          new_headers['Authorization'] = (tokenType ? tokenType : 'bearer') + ' ' + token;
                        }
                        return next
                          .handle(req.clone({
                            headers: new HttpHeaders(new_headers),
                          }));
                      }),
                    );
                } else {
                  return throwError(error);
                }
              }),
            );
          }
          return request;
        }),
      );
  }
}
