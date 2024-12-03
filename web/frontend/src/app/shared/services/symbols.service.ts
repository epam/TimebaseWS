import { HttpClient }          from '@angular/common/http';
import { Injectable }          from '@angular/core';
import { Observable }   from 'rxjs';
import { map, shareReplay }                 from 'rxjs/operators';
import { PropsModel }          from '../../pages/streams/models/props.model';
import * as fromStreamProps    from '../../pages/streams/store/stream-props/stream-props.reducer';
import { SymbolConfig }        from '../models/symbol.config';
import { CacheRequestService } from './cache-request.service';

@Injectable({
  providedIn: 'root',
})
export class SymbolsService {
  private rangeRequestsInProgress = {};
  lastRangeRequestTimestamp: number = 0;
  symbolList = {};
  lastLoadedSymbolList = {};

  constructor(private httpClient: HttpClient, private cacheRequestService: CacheRequestService) {}
  
  getSymbols(stream: string, spaceId: string = null, filter: string = null): Observable<string[]> {
    const params: { [index: string]: string | string[] } = {};
    if (typeof spaceId === 'string') {
      params.space = encodeURIComponent(spaceId);
    }
    
    if (filter) {
      params.filter = filter;
    }
    
    return this.httpClient.get<string[]>(`/${encodeURIComponent(stream)}/symbols`, {
      params,
      headers: {customError: 'true'},
    });
  }
  
  config(symbol: string, hiddenExchanges: string[]): Observable<SymbolConfig> {
    return this.httpClient.get<SymbolConfig>(`/instruments/${encodeURIComponent(symbol)}/info`, {
      params: {hiddenExchanges},
    });
  }
  
  getProps(stream: string, symbol: string, time = null, fromCache = true): Observable<fromStreamProps.State> {
    const props$ = this.httpClient
      .get<PropsModel>(`/${encodeURIComponent(stream)}/options/${encodeURIComponent(symbol)}`, {
        headers: {customError: 'true'},
      })
      .pipe(map((resp) => ({props: resp || null, opened: false})));

    if (fromCache) {
      return this.cacheRequestService.cache(
        {action: 'SymbolsService.getProps', stream, symbol},
        props$,
        time,
      );
    } else {
      return props$;
    }
  }

  getRanges(stream: string, symbols: string[]): Observable<{ start: string, end: string }> {
    const cashKey = JSON.stringify( { stream, symbols } );
    if (this.rangeRequestsInProgress[cashKey] && Date.now() - this.lastRangeRequestTimestamp < 5000) {
      return this.rangeRequestsInProgress[cashKey];
    } else {
      const params = { symbols };
      this.lastRangeRequestTimestamp = Date.now();
      this.rangeRequestsInProgress[cashKey] = 
        this.httpClient.get<{ start: string, end: string }>(`/${encodeURIComponent(stream)}/range/`, { params }).pipe(shareReplay(1));
      return this.rangeRequestsInProgress[cashKey];
    }
  }
}
