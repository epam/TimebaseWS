import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { mapTo }      from 'rxjs/operators';
import { ViewInfo }   from '../models/view';

@Injectable({
  providedIn: 'root',
})
export class ViewsService {
  constructor(private httpClient: HttpClient) {
  }
  
  save(id: string, query: string, live: boolean): Observable<void> {
    return this.httpClient.post('/timebase/views', {id, query, live}, {headers: {customError: 'true'}}).pipe(mapTo(null));
  }
  
  get(id: string): Observable<ViewInfo> {
    const idParam = encodeURIComponent(id);
    return this.httpClient.get<ViewInfo>(`/timebase/views/${idParam}`);
  }
  
  delete(id: string): Observable<void> {
    const idParam = encodeURIComponent(id);
    return this.httpClient.delete(`/timebase/views/${idParam}`).pipe(mapTo(null));
  }
}
