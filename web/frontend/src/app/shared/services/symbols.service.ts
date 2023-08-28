import { HttpClient }          from '@angular/common/http';
import { Injectable }          from '@angular/core';
import { Observable, timer }   from 'rxjs';
import { map }                 from 'rxjs/operators';
import { PropsModel }          from '../../pages/streams/models/props.model';
import * as fromStreamProps    from '../../pages/streams/store/stream-props/stream-props.reducer';
import { SymbolConfig }        from '../models/symbol.config';
import { CacheRequestService } from './cache-request.service';

@Injectable({
  providedIn: 'root',
})
export class SymbolsService {
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
  
  getProps(stream: string, symbol: string, time = null): Observable<fromStreamProps.State> {
    return this.cacheRequestService.cache(
      {action: 'SymbolsService.getProps', stream, symbol},
      this.httpClient
        .get<PropsModel>(`/${encodeURIComponent(stream)}/options/${encodeURIComponent(symbol)}`, {
          headers: {customError: 'true'},
        })
        .pipe(map((resp) => ({props: resp || null, opened: false}))),
      time,
    );
  }
}
