import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, Subject, timer} from 'rxjs';
import {finalize, map, shareReplay, switchMap, takeUntil, tap} from 'rxjs/operators';
import {MenuItem} from '../models/menu-item';

@Injectable({
  providedIn: 'root',
})
export class MenuItemsService {
  private cache: {[index: string]: Observable<MenuItem>} = {};
  private requestInProgress = false;
  private waitingRequests = new Map<string, Observable<MenuItem>>();

  constructor(private httpClient: HttpClient) {}

  getItems(paths: string[], showSpaces = false, filter = null, views = false, filterOptions = null, cache = true): Observable<MenuItem> {
    if (this.requestInProgress) {
      const waitingRequestKey = JSON.stringify({paths, showSpaces, filter, views});
      if (!this.waitingRequests.get(waitingRequestKey)) {
        this.waitingRequests.set(
          waitingRequestKey,
          timer().pipe(
            switchMap(() => this.getItems(paths, showSpaces, filter, views, filterOptions, cache)),
            tap(() => this.waitingRequests.delete(waitingRequestKey)),
          ),
        );
      }

      return this.waitingRequests.get(waitingRequestKey);
    }

    this.requestInProgress = true;

    const final$ = new Subject();
    const request$ = this.httpClient.post<MenuItem>('structure', {paths, showSpaces, filter, views, filterOptions}).pipe(
      takeUntil(final$),
      shareReplay(1),
      map((data) => JSON.parse(JSON.stringify(data))),
      finalize(() => {
        this.requestInProgress = false;
        final$.next();
        final$.complete();
      }),
    );

    if (filter) {
      return request$;
    }
    const key = JSON.stringify({paths, showSpaces, views});
    if (!cache || !this.cache[key]) {
      this.cache[key] = request$;
    }

    return this.cache[key];
  }

  clearCache() {
    this.cache = {};
  }
}
