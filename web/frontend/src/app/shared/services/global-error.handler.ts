import {ErrorHandler, Injectable} from '@angular/core';
import {Observable, timer} from 'rxjs';
import {map, tap} from 'rxjs/operators';

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  private catchingErrors = false;
  private errorBag = [];

  catchErrors(callback: () => void): Observable<boolean> {
    this.catchingErrors = true;
    this.errorBag = [];
    callback();
    return timer().pipe(
      map(() => this.errorBag.length > 0),
      tap(() => {
        this.catchingErrors = false;
        this.errorBag = [];
      }),
    );
  }

  handleError(error: any): void {
    if (this.catchingErrors) {
      this.errorBag.push(error);
    } else {
      super.handleError(error);
    }
  }
}
