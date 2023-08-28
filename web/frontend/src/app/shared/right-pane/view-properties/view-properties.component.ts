import { Component, OnInit }                            from '@angular/core';
import { select, Store }                                from '@ngrx/store';
import { combineLatest, Observable }                    from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { getActiveTab }                                 from '../../../pages/streams/store/streams-tabs/streams-tabs.selectors';
import { formatHDate }                                  from '../../locale.timezone';
import { ViewInfo }                                     from '../../models/view';
import { GlobalFiltersService }                         from '../../services/global-filters.service';
import { ViewsService }                                 from '../../services/views.service';

export interface ViewInfoFormatted extends ViewInfo {
  lastTimestampFormatted: string;
}

@Component({
  selector: 'app-view-properties',
  templateUrl: './view-properties.component.html',
})
export class ViewPropertiesComponent implements OnInit {
  
  infoFormatted$: Observable<ViewInfoFormatted>;
  title$: Observable<string>;
  
  fields = ['stream', 'state', 'lastTimestampFormatted', 'query'];
  
  constructor(
    private viewsService: ViewsService,
    private store: Store,
    private globalFiltersService: GlobalFiltersService,
  ) { }

  ngOnInit(): void {
    const info$ = this.store.pipe(
      select(getActiveTab),
      filter(t => !!t),
      distinctUntilChanged((t1, t2) => t1.id === t2.id),
      switchMap(tab => this.viewsService.get(tab.streamName)),
    );
    
    this.infoFormatted$ = combineLatest([
      info$,
      this.globalFiltersService.getFilters(),
    ]).pipe(map(([info, filters]) => {
      return {
        ...info,
        lastTimestampFormatted: info.lastTimestamp > 0 ? formatHDate(
          new Date(info.lastTimestamp).toISOString(),
          filters.dateFormat,
          filters.timeFormat,
          filters.timezone,
        ) : null,
      };
    }));
  }
}
