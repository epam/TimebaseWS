import {Injectable} from '@angular/core';
import {Observable, timer} from 'rxjs';
import {shareReplay} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CacheRequestService {
  private cacheStorage: {[index: string]: Observable<unknown>} = {};

  cache<T>(key: object, source$: Observable<T>, time = null): Observable<T> {
    const stringKey = JSON.stringify(key);
    if (!this.cacheStorage[stringKey]) {
      this.cacheStorage[stringKey] = source$.pipe(shareReplay(1));
    }

    if (time) {
      timer(time).subscribe(() => (this.cacheStorage[stringKey] = null));
    }

    return this.cacheStorage[stringKey] as Observable<T>;
  }
}
