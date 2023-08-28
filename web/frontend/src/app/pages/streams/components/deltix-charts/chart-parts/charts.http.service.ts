import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { mapTo }      from 'rxjs/operators';
import { ChartModel } from '../../../models/chart.model';

@Injectable({
  providedIn: 'root',
})
export class ChartsHttpService {
  constructor(private httpClient: HttpClient) {
  }
  
  data(stream: string, params: { [index: string]: string }, correlationId: string): Observable<ChartModel[]> {
    return this.httpClient.get<ChartModel[]>(`charting/dx/${encodeURIComponent(stream)}`, {
      params: {...params, correlationId},
      headers: {customError: 'true'},
    });
  }
  
  correlationId(): Observable<string> {
    return this.httpClient.get<string>('/correlationId');
  }
  
  stopRequest(correlationId: string): Observable<void> {
    return this.httpClient
      .get('charting/dx/stopCharting', {params: {correlationId}})
      .pipe(mapTo(null));
  }
  
  linesInfo(stream: string): Observable<string[]> {
    return this.httpClient.get<string[]>(`charting/${encodeURIComponent(stream)}/settings/linear-chart-columns`);
  }
}
