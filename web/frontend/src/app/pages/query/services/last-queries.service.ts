import {Injectable} from '@angular/core';
import {StorageMap} from '@ngx-pwa/local-storage';
import {BehaviorSubject, Observable} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {LastQuery} from '../../../shared/models/last-query';

@Injectable({
  providedIn: 'root',
})
export class LastQueriesService {
  private queries$ = new BehaviorSubject<LastQuery[]>([]);
  private queriesLimit = 20;

  constructor(private storageMap: StorageMap) {
    this.storageMap
      .get('last-queries')
      .pipe(take(1))
      .subscribe((queries: LastQuery[]) => {
        this.queries$.next(queries || []);
      });
  }

  add(streams: string[], query: string) {
    const current = this.queries$.getValue();
    const doubleIndex = current.findIndex((q) => q.query === query);
    if (doubleIndex > -1) {
      current.splice(doubleIndex, 1);
    }

    if (current.length >= this.queriesLimit) {
      current.splice(0, 1);
    }

    current.push({streams, query});
    this.storageMap.set('last-queries', current).subscribe();
    this.queries$.next(current);
  }

  getQueries(): Observable<LastQuery[]> {
    return this.queries$.pipe(map((queries) => [...queries].reverse()));
  }
}
