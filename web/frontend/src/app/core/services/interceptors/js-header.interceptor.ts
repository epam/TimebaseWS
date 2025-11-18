import {
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

@Injectable()
export class AcceptBigIntFormatInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('select') || req.url.includes('query') || req.url.includes('filter')) {
      const reqUrl = ((req.url[0] !== '/' && req.url[0] !== '.') ||
        (req.url[0] === '.' && req.url[1] !== '/')) &&
        req.url.search('http') < 0
        ? '/' + req.url
        : req.url;

      const headers = {};

      req.headers.keys().forEach((key) => {
        headers[key] = req.headers.get(key);
      });

      headers['X-JSON-BigInt-Encoding'] = 'string';
      
      return next.handle(
        req.clone({
          url: reqUrl,
          headers: new HttpHeaders(headers),
        }),
      );
    }
    return next.handle(req.clone());
  }
}
