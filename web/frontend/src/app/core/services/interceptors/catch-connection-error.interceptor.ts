import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {CheckConnectionService} from '../../../shared/services/check-connection.service';

@Injectable()
export class CatchConnectionErrorInterceptor implements HttpInterceptor {
  constructor(private checkConnectionService: CheckConnectionService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error) => {
        if (error?.status !== 401 && !req.headers.get('connectionCheck')) {
          this.checkConnectionService.requestError();
        }
        return throwError(error);
      }),
    );
  }
}
