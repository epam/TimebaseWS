import {Injectable} from '@angular/core';
import {BsDatepickerConfig} from 'ngx-bootstrap/datepicker';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {GlobalFilterTimeZone} from '../../pages/streams/models/global.filter.model';
import {DEFAULT_TIME_ZONE, dateFormatsSupported, timeFormatsSupported, 
  defaultDateFormat, defaultTimeFormat, } from '../locale.timezone';
import {GlobalFilters} from '../models/global-filters';
import {SyncStorageService} from './sync-storage.service';
import { getTimeZones } from '../utils/timezone.utils';

interface GlobalFiltersState {
  filter_date_format: string[];
  filter_time_format: string[];
  filter_timezone: GlobalFilterTimeZone[];
  reverseViewIsDefault: boolean;
  showSpaces: boolean;
  hideSystemStreams: boolean;
  showTopics: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class GlobalFiltersService {
  private defaultFilters: GlobalFiltersState = {
    filter_date_format: dateFormatsSupported.includes(defaultDateFormat) ? [defaultDateFormat] : [dateFormatsSupported[0]],
    filter_time_format: [defaultTimeFormat],
    filter_timezone: DEFAULT_TIME_ZONE ? [DEFAULT_TIME_ZONE] : [{
      alias: "UTC",
      name: "UTC",
      offset: 0,
      nameTitle: 'UTC'
    }],
    reverseViewIsDefault: false,
    showSpaces: false,
    hideSystemStreams: false,
    showTopics: false
  };

  private lastFilters: GlobalFilters;

  constructor(private syncStorageService: SyncStorageService) {}

  getFilters(): Observable<GlobalFilters> {
    return this.syncStorageService.getData('global_filter').pipe(
      map((action) => {
        const data = (action || this.defaultFilters) as GlobalFilters;
        Object.keys(data).forEach((key) => {
          if (!['filter_date_format', 'filter_time_format', 'filter_timezone'].includes(key)) {
            return;
          }
          if (!data[key]?.length) {
            data[key] = this.lastFilters?.[key] || this.defaultFilters[key];
          }
        });
        this.lastFilters = data;
        const getData = (key): any[] => (data[key] && data[key].length ? [...data[key]] : []);
        const savedTimezone = getData('filter_timezone');
        const availableTimezones = getTimeZones();
        const timezoneInTheList = availableTimezones.find(timezone => timezone.name == savedTimezone[0].name);

        const savedDateFormat = getData('filter_date_format');
        const dateFormatInTheList = dateFormatsSupported.includes(savedDateFormat[0]);

        const savedTimeFormat = getData('filter_time_format');
        const timeFormatInTheList = timeFormatsSupported.includes(savedTimeFormat[0]);

        return {
          dateFormat: dateFormatInTheList ? savedDateFormat : this.defaultFilters.filter_date_format,
          timeFormat: timeFormatInTheList ? savedTimeFormat : this.defaultFilters.filter_time_format,
          timezone: timezoneInTheList ? savedTimezone : [DEFAULT_TIME_ZONE],
          reverseViewIsDefault: data.reverseViewIsDefault,
          showSpaces: data.showSpaces,
          hideSystemStreams: data.hideSystemStreams,
          showTopics: data.showTopics
        };
      }),
    );
  }

  getBsConfig(hideNanoSeconds = false): Observable<Partial<BsDatepickerConfig>> {
    return this.getFilters().pipe(
      map((filters) => {
        const dateInputFormat = `${filters.dateFormat[0].toUpperCase()} ${filters.timeFormat[0]}`
          .replace('tt', 'A')
          .replace(/f/g, 'S');
      return {
        containerClass: 'theme-default',
        dateInputFormat: !hideNanoSeconds ? dateInputFormat :
          dateInputFormat.replace(/S{9}/, 'SSS').replace(/S{6}/, 'SSS')
      }
    }));
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
          [selected.timeFormat[0], this.defaultFilters.filter_time_format[0]],
          [selected.dateFormat[0], this.defaultFilters.filter_date_format[0]],
          [selected.timezone[0].name, DEFAULT_TIME_ZONE ? DEFAULT_TIME_ZONE.name : 'UTC'],
          [selected.reverseViewIsDefault, this.defaultFilters.reverseViewIsDefault],
          [selected.showSpaces, this.defaultFilters.showSpaces],
          [selected.hideSystemStreams, this.defaultFilters.hideSystemStreams],
          [selected.showTopics, this.defaultFilters.showTopics],
        ];

        return !!compare.find((set) => set[0] !== set[1]);
      }),
    );
  }
}
