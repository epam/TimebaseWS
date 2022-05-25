import { Injectable }                                                  from '@angular/core';
import { BsDatepickerConfig }                                          from 'ngx-bootstrap/datepicker';
import { Observable }                                                  from 'rxjs';
import { map }                                                         from 'rxjs/operators';
import { GlobalFilterTimeZone }                                        from '../../pages/streams/models/global.filter.model';
import { DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT, DEFAULT_TIME_ZONE } from '../locale.timezone';
import { GlobalFilters }                                               from '../models/global-filters';
import { SyncStorageService }                                          from './sync-storage.service';

interface GlobalFiltersState {
  filter_date_format: string[];
  filter_time_format: string[];
  filter_timezone: GlobalFilterTimeZone[];
}

@Injectable({
  providedIn: 'root',
})
export class GlobalFiltersService {
  private defaultFilters: GlobalFiltersState = {
    filter_date_format: [DEFAULT_DATE_FORMAT],
    filter_time_format: [DEFAULT_TIME_FORMAT],
    filter_timezone: [DEFAULT_TIME_ZONE],
  };

  private lastFilters: GlobalFilters;

  constructor(private syncStorageService: SyncStorageService) {}

  getFilters(): Observable<GlobalFilters> {
    return this.syncStorageService.getData('global_filter').pipe(
      map((action) => {
        const data = (action || this.defaultFilters) as GlobalFilters;
        Object.keys(data).forEach((key) => {
          if (!data[key]?.length) {
            data[key] = this.lastFilters?.[key] || this.defaultFilters[key];
          }
        });

        this.lastFilters = data;
        const getData = (key): any[] => (data[key] && data[key].length ? [...data[key]] : []);
        return {
          dateFormat: getData('filter_date_format'),
          timeFormat: getData('filter_time_format'),
          timezone: getData('filter_timezone'),
        };
      }),
    );
  }

  getBsConfig(): Observable<Partial<BsDatepickerConfig>> {
    return this.getFilters().pipe(
      map((filters) => ({
        containerClass: 'theme-default',
        dateInputFormat: `${filters.dateFormat[0].toUpperCase()} ${filters.timeFormat[0]}`
          .replace('tt', 'A')
          .replace(/f/g, 'S'),
      })),
    );
  }

  setFilters(filters: GlobalFiltersState) {
    this.syncStorageService.save('global_filter', filters).subscribe();
  }

  clear() {
    this.syncStorageService.remove('global_filter').subscribe();
  }

  hasChanges(): Observable<boolean> {
    return this.getFilters().pipe(
      map((selected) => {
        const compare = [
          [selected.timeFormat[0], DEFAULT_TIME_FORMAT],
          [selected.dateFormat[0], DEFAULT_DATE_FORMAT],
          [selected.timezone[0].name, DEFAULT_TIME_ZONE.name],
        ];

        return !!compare.find((set) => set[0] !== set[1]);
      }),
    );
  }
}
