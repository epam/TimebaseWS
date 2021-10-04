import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable }                                                        from '@angular/core';
import { select, Store }                                                     from '@ngrx/store';
import { TranslateService }                                                  from '@ngx-translate/core';

import { Observable, throwError }                              from 'rxjs';
import { catchError, filter, switchMap, take, withLatestFrom } from 'rxjs/operators';
import * as NotificationsActions
                                                               from '../../modules/notifications/store/notifications.actions';
import { AppState }                                            from '../../store';
import { getApiPrefix, getAppState }                           from '../../store/app/app.selectors';

@Injectable()
export class RequestDefaultErrorInterceptor implements HttpInterceptor {
  constructor(
    private translate: TranslateService,
    private appStore: Store<AppState>,
  ) {}

  private handleError(error) {
    if (error && error.status && error.status !== 401) {
      console.warn('HTTP ERROR: ', error); // TODO: Delete this before checkIN
      return this.translate.get('notification_messages')
        .pipe(
          withLatestFrom(this.appStore.pipe(select(getApiPrefix))),
          take(1),
          switchMap(([messages, apiPrefix]) => {
            let message, interval = 5000;
            if (error.error && error.error.message) {
              message = error.error.message;
            } else if (error.error_description) {
              message = error.error_description;
            } else if (error.status === 403) {
              message = `${messages.access_denied} <b>'${error.url.split(apiPrefix)[1]}</b>'`;
              interval = 15000;
            } else {
              message = messages.network_error;
            }
            this.appStore.dispatch(new NotificationsActions.AddAlert({
              message: message,
              dismissible: true,
              closeInterval: interval,
            }));
            return throwError(error);
          }),
        );
    } else {
      return throwError(error);
    }
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const customError = req.headers.get('customError'),
      headers = {};

    req.headers.keys().forEach(key => {
      headers[key] = req.headers.get(key);
    });

    delete headers['customError'];

    if (!customError && !headers['ignoreApiPrefix']) {
      return this.appStore
        .pipe(
          select(getAppState),
          filter(appState => !appState.preventRequests),
          take(1),
          switchMap(() => {
            return next
              .handle(req.clone({headers: new HttpHeaders(headers)}))
              .pipe(
                catchError(this.handleError.bind(this)),
              );
          }),
        );
    } else {
      // delete headers['customError'];
      return next
        .handle(req.clone({headers: new HttpHeaders(headers)}));
    }
  }
}
