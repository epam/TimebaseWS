import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BarChartPeriod} from '../models/bar-chart-period';

@Injectable({
  providedIn: 'root',
})
export class PeriodsService {
  constructor(private httpClient: HttpClient) {}

  getPeriods(): Observable<BarChartPeriod[]> {
    return this.httpClient.get<BarChartPeriod[]>('/charting/settings/barPeriodicities');
  }
}
