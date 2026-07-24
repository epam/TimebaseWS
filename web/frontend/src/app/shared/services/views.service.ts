import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { mapTo, shareReplay }      from 'rxjs/operators';
import { ViewInfo }   from '../models/view';

@Injectable({
  providedIn: 'root',
})
export class ViewsService {
  constructor(private httpClient: HttpClient) {
  }

  getViews(tbId?: string) {
    const params = tbId ? {tb: tbId} : {};
    return this.httpClient.get<ViewInfo[]>('/timebase/views', {params}).pipe(shareReplay(1));
  }

  save(id: string, query: string, live: boolean, tbId?: string): Observable<void> {
    const params = tbId ? {tb: tbId} : {};
    return this.httpClient.post('/timebase/views', {id, query, live}, {headers: {customError: 'true'}, params}).pipe(mapTo(null));
  }

  get(id: string, tbId?: string): Observable<ViewInfo> {
    const idParam = encodeURIComponent(id);
    const params = tbId ? {tb: tbId} : {};
    return this.httpClient.get<ViewInfo>(`/timebase/views/${idParam}`, {params});
  }

  delete(id: string, tbId?: string): Observable<void> {
    const idParam = encodeURIComponent(id);
    const params = tbId ? {tb: tbId} : {};
    return this.httpClient.delete(`/timebase/views/${idParam}`, {params}).pipe(mapTo(null));
  }

  restart(id: string, tbId?: string, from?: string): Observable<void> {
    const idParam = encodeURIComponent(id);
    const params: Record<string, string> = tbId ? {tb: tbId} : {};
    if (from) params['from'] = from;
    return this.httpClient.put(`/timebase/views/${idParam}/restart`, null, {params}).pipe(mapTo(null));
  }

  stop(id: string, tbId?: string): Observable<void> {
    const idParam = encodeURIComponent(id);
    const params = tbId ? {tb: tbId} : {};
    return this.httpClient.put(`/timebase/views/${idParam}/stop`, null, {params}).pipe(mapTo(null));
  }
}
