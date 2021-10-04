import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { select, Store } from '@ngrx/store';
import * as fromApp      from '../../store/app/app.reducer';
import { AppState }      from '../../store';
import { Observable }    from 'rxjs';
import { Injectable } from '@angular/core';
import { filter, take, switchMap } from 'rxjs/operators';

@Injectable()
export class ApiPrefixesInterceptor implements HttpInterceptor {
  constructor(
    private appStore: Store<AppState>,
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.appStore
      .pipe(
        select('appSelf'),
        filter((appState: fromApp.State) => appState.app_init),
        take(1),
        switchMap((appState: fromApp.State) => {
          let prefix = appState.apiPrefix;
          const reqUrl = (req.url[0] !== '/' && req.url[0] !== '.' || (req.url[0] === '.' && req.url[1] !== '/')) && req.url.search('http') < 0 ? '/' + req.url : req.url;
          const headers = {};

          req.headers.keys().forEach(key => {
            headers[key] = req.headers.get(key);
          });

          if (headers['ignoreApiPrefix'] === 'true') {
            prefix = appState.authPrefix;
          }
          delete headers['ignoreApiPrefix'];

          if (headers['_authrequest'] === 'true') {
            prefix = appState.authPrefix;
            headers['Authorization'] = 'Basic d2ViOnNlY3JldA==';
          }
          delete headers['_authrequest'];

          if (reqUrl[0] === '.' && reqUrl[1] === '/') {
            prefix = '';
          }
          return next
            .handle(req.clone({
              url: prefix + reqUrl,
              headers: new HttpHeaders(headers),
            }));
        }),
      );
  }
}
