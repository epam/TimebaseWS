import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map, shareReplay} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  private isWriter$: Observable<boolean>;

  constructor(private httpClient: HttpClient) {}

  isWriter(): Observable<boolean> {
    if (!this.isWriter$) {
      this.isWriter$ = this.httpClient.get('/writable', {headers: {customError: 'true'}}).pipe(
        map(() => true),
        catchError(() => of(false)),
        shareReplay(1),
      );
    }

    return this.isWriter$;
  }

  readOnly(): Observable<boolean> {
    return this.isWriter().pipe(map((writer) => !writer));
  }
}
