import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, mapTo }      from 'rxjs/operators';
import { ChartModel } from '../../../models/chart.model';

@Injectable({
  providedIn: 'root',
})
export class ChartsHttpService {
  constructor(private httpClient: HttpClient) {
  }
  
  data(stream: string, params: { [index: string]: string | string[] }, correlationId: string): Observable<ChartModel[]> {
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

  getMarketHours(startTime: string, endTime: string, exchangeId: string) {
    const startDay = new Date(startTime);
    startDay.setDate(startDay.getDate() - 1);

    const daysInRange = Math.ceil((+new Date(endTime) - +new Date(startTime)) / (1000 * 60 * 60 * 24));
    const params = {
      from: startDay.toISOString(),
      offset: 0,
      rows: daysInRange + 2,
    };
    return this.httpClient.get(`calendar/${exchangeId}/select`, { params })
      .pipe(
        map((marketInfo: any[]) => {
          return marketInfo
            .filter(dayInfo => new Date(dayInfo.timestamp) < new Date(endTime))
            .reduce((acc, dayInfo) => [...acc, ...dayInfo.sessions], [])
            .map(session => ({ startTime: +new Date(session.startTime), endTime: +new Date(session.endTime) }));
        })
      );
  }
}
