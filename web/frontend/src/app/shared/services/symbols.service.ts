import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SymbolsService {
  constructor(private httpClient: HttpClient) {
  }

  getSymbols(stream: string, spaceId: string = null, filter: string = null): Observable<string[]> {
    const params: {[index: string]: string | string[]} = {};
    if (typeof spaceId === 'string') {
      params.space = encodeURIComponent(spaceId);
    }

    if (filter) {
      params.filter = filter;
    }

    return this.httpClient
      .get<string[]>(`/${encodeURIComponent(stream)}/symbols`, { params });
  }
}
