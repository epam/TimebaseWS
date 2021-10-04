import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StreamModel } from '../../pages/streams/models/stream.model';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StreamsService {

  private cachedList$: Observable<StreamModel[]>;

  constructor(private httpClient: HttpClient) {
  }

  range(stream: string, symbol: string = null, spaceName: string = null): Observable<{ end: string, start: string }> {
    return this.httpClient
      .get<{ end: string, start: string }>(`/${encodeURIComponent(stream)}/range`, {
        params: {
          ...(symbol ? {symbols: encodeURIComponent(symbol)} : {}),
          ...(typeof spaceName === 'string' ? {spaceName} : {}),
        },
      });
  }

  getList(useCache, filter: string = null, spaces: boolean = null): Observable<StreamModel[]> {
    const params = [];
    if (filter?.length) {
      params.push(`filter=${encodeURIComponent(filter)}`);
    }

    if (spaces) {
      params.push('spaces=true');
    }

    const req = '/streams' + (params.length ? `?${params.join('&')}` : '');
    const canGetCache = !params.length;
    
    if (useCache && canGetCache && this.cachedList$) {
      return this.cachedList$;
    }

    const streams$ = this.httpClient.get<StreamModel[]>(req).pipe(
      map(resp => resp.sort((a, b) => (a.key.toLowerCase() > b.key.toLowerCase()) ? 1 : ((b.key.toLowerCase() > a.key.toLowerCase()) ? -1 : 0))),
      shareReplay(1),
    );

    if (canGetCache) {
      this.cachedList$ = streams$;
    }

    return streams$;
  }
}
