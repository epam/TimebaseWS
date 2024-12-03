import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, Subject, timer} from 'rxjs';
import {finalize, map, shareReplay, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {MenuItem} from '../models/menu-item';

@Injectable({
  providedIn: 'root',
})
export class MenuItemsService {
  private cache: {[index: string]: Observable<MenuItem>} = {};
  private requestInProgress = false;
  private waitingRequests = new Map<string, Observable<MenuItem>>();

  constructor(private httpClient: HttpClient) {}

  getSymbolPath(stream: string, symbol: string, showSpaces = false, filter = null, views = false, filterOptions = null) {
    const filterParams = filterOptions ? {
      ...filterOptions,
      filterRootOnly: filterOptions.match === "streams",
      matchExactly: !!filterOptions.matchExactly,   
    } : null;
    return this.httpClient.post(`structure/${encodeURIComponent(stream)}/${encodeURIComponent(symbol)}`, 
      { showSpaces, filter, views, filterOptions: filterParams });
  }

  getItems(paths: string[], showSpaces = false, filter = null, views = false, filterOptions = null, cache = true): Observable<MenuItem> {

    const filterParams = filterOptions ? {
      ...filterOptions,
      filterRootOnly: filterOptions.match === "streams",
      matchExactly: !!filterOptions.matchExactly,   
    } : null;

    delete filterParams?.match;

    if (this.requestInProgress) {
      const waitingRequestKey = JSON.stringify({paths, showSpaces, filter, views});
      if (!this.waitingRequests.get(waitingRequestKey)) {
        this.waitingRequests.set(
          waitingRequestKey,
          timer().pipe(
            switchMap(() => this.getItems(paths, showSpaces, filter, views, filterParams, cache)),
            tap(() => this.waitingRequests.delete(waitingRequestKey)),
          ),
        );
      }

      return this.waitingRequests.get(waitingRequestKey);
    }

    this.requestInProgress = true;

    const final$ = new Subject();
    const request$ = this.httpClient.post<MenuItem>('structure', {paths, showSpaces, filter, views, filterOptions: filterParams}).pipe(
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

  getTopics(filter: string, filterOptions: object) {
    const body = {
      filter,
      filterOptions
    };
    const final$ = new Subject();
    return this.httpClient.post('/topics/structure', body)
      .pipe(
        take(1),
        shareReplay(1),
        finalize(() => {
          this.requestInProgress = false;
          final$.next();
          final$.complete();
        }),
      );
  }
}
