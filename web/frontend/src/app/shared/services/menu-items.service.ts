import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {MenuItem} from '../models/menu-item';

@Injectable({
  providedIn: 'root',
})
export class MenuItemsService {
  private cache: {[index: string]: Observable<MenuItem>} = {};

  constructor(private httpClient: HttpClient) {}

  getItems(paths: string[], showSpaces = false, filter = null, cache = true): Observable<MenuItem> {
    const key = JSON.stringify({paths, showSpaces});
    const request$ = this.httpClient.post<MenuItem>('structure', {paths, showSpaces, filter}).pipe(
      shareReplay(1),
      map((data) => JSON.parse(JSON.stringify(data))),
    );

    if (filter) {
      return request$;
    }

    if (!cache || !this.cache[key]) {
      this.cache[key] = request$;
    }

    return this.cache[key];
  }

  clearCache() {
    this.cache = {};
  }
}
