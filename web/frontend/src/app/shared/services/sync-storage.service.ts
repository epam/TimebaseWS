import {Injectable} from '@angular/core';
import {StorageMap} from '@ngx-pwa/local-storage';
import equal from 'fast-deep-equal/es6';
import {fromEvent, Observable} from 'rxjs';
import {distinctUntilChanged, filter, mapTo, startWith, switchMap, tap} from 'rxjs/operators';
import {uuid} from '../utils/uuid';

@Injectable({
  providedIn: 'root',
})
export class SyncStorageService {
  constructor(private storageMap: StorageMap) {}

  save(key: string, data: unknown): Observable<void> {
    return this.storageMap.set(key, data).pipe(
      tap(() => {
        localStorage.setItem('sync-event', uuid());
      }),
    );
  }

  getData(key: string): Observable<unknown> {
    return this.onStorageChange().pipe(
      switchMap(() => this.storageMap.watch(key)),
      distinctUntilChanged(equal),
    );
  }

  remove(key: string): Observable<void> {
    return this.storageMap.delete(key).pipe(
      tap(() => {
        localStorage.setItem('sync-event', uuid());
      }),
    );
  }

  private onStorageChange(): Observable<void> {
    return fromEvent(window, 'storage').pipe(
      filter((resp: StorageEvent) => resp.key === 'sync-event'),
      startWith(null),
      mapTo(null),
    );
  }
}
