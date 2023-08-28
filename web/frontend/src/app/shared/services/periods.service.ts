import {HttpClient}            from '@angular/common/http';
import {Injectable}            from '@angular/core';
import {Observable}            from 'rxjs';
import {BarChartPeriod}        from '../models/bar-chart-period';
import { CacheRequestService } from './cache-request.service';

@Injectable({
  providedIn: 'root',
})
export class PeriodsService {
  constructor(
    private httpClient: HttpClient,
    private cacheRequestService: CacheRequestService,
  ) {}

  getPeriods(): Observable<BarChartPeriod[]> {
    return this.cacheRequestService.cache({action: 'barPeriodicities'}, this.httpClient.get<BarChartPeriod[]>('/charting/settings/barPeriodicities'));
  }
}
