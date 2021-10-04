import { Injectable }                        from '@angular/core';
import { select, Store }                     from '@ngrx/store';
import { getStreamGlobalFilters }            from '../../pages/streams/store/stream-details/stream-details.selectors';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { AppState }                          from '../../core/store';
import { Observable }                                                  from 'rxjs';
import { DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT, DEFAULT_TIME_ZONE } from '../locale.timezone';
import { GlobalFilters }                                               from '../models/global-filters';

@Injectable({
  providedIn: 'root',
})
export class GlobalFiltersService {

  constructor(private appStore: Store<AppState>) {
  }

  getFilters(): Observable<GlobalFilters> {
    return this.appStore
      .pipe(
        select(getStreamGlobalFilters),
        filter(Boolean),
        distinctUntilChanged(),
        map(action => {
          const getData = (key): any[] => action[key] && action[key].length ? [...action[key]] : [];
          return {
            dateFormat: getData('filter_date_format'),
            timeFormat: getData('filter_time_format'),
            timezone: getData('filter_timezone'),
          };
        }),
      );
  }
  
  hasChanges(): Observable<boolean> {
    return this.getFilters().pipe(map(selected => {
      const compare = [
        [selected.timeFormat[0], DEFAULT_TIME_FORMAT],
        [selected.dateFormat[0], DEFAULT_DATE_FORMAT],
        [selected.timezone[0].name, DEFAULT_TIME_ZONE.name],
      ];
     
      return !!compare.find(set => set[0] !== set[1]);
    }));
  }
}
