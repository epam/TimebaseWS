import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder }                                                                   from '@angular/forms';
import { ActivatedRoute }                                                                from '@angular/router';
import { HdDate }                                                                        from '@assets/hd-date/hd-date';
import { select, Store }                                                                 from '@ngrx/store';

import { combineLatest, Observable, Subject }                                           from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { AppState }                                                                     from '../../../../../core/store';
import { RightPaneService }                                                             from '../../../../../shared/right-pane/right-pane.service';
import { StorageService }                                                               from '../../../../../shared/services/storage.service';
import { StreamsService }                                                               from '../../../../../shared/services/streams.service';
import { TabStorageService }                                                            from '../../../../../shared/services/tab-storage.service';
import { WIDTH_VALUES_MS }                                                              from '../../../models/filter.model';
import { TabModel }                                                                     from '../../../models/tab.model';
import { TabSettingsModel }                                                             from '../../../models/tab.settings.model';
import { ChartTrackService }                                                            from '../../../services/chart-track.service';
import * as StreamDetailsActions
                                                                                        from '../../../store/stream-details/stream-details.actions';
import * as fromStreamDetails
                                                                                        from '../../../store/stream-details/stream-details.reducer';
import { streamsDetailsStateSelector }                                                  from '../../../store/stream-details/stream-details.selectors';
import * as StreamsTabsActions
                                                                                        from '../../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveTab,
  getActiveTabSettings,
}                                                                                       from '../../../store/streams-tabs/streams-tabs.selectors';
import { DeltixChartFeedService }                                                       from '../chart-parts/detix-chart-feed.service';

@Component({
  selector: 'app-charts-layout',
  templateUrl: './charts-layout.component.html',
  styleUrls: ['./charts-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ChartTrackService, DeltixChartFeedService, TabStorageService, RightPaneService],
})
export class ChartsLayoutComponent implements OnInit, OnDestroy {
  public tabSettings$: Observable<TabSettingsModel>;
  public tabSettings: TabSettingsModel = {};
  public btnsState = {
    lock_zoom_in: false,
    _loading: false,
    _same_datetime: false,
    _noChartType: false,
  };
  public date_format: string;
  public time_format: string;
  public datetime_separator: string;
  public format: string;
  public bsFormat: string;
  public streamDetails$: Observable<fromStreamDetails.State>;
  public levels: number;
  public rangeFromValue: Date;
  public rangeToValue: Date;
  public timeRangeTitle: string;
  public closedProps: boolean;
  @ViewChild('btn') btn: ElementRef;
  public widthValuesMs = WIDTH_VALUES_MS;
  private destroy$ = new Subject();

  constructor(
    private appStore: Store<AppState>,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private storageService: StorageService,
    private streamsService: StreamsService,
  ) {}

  ngOnInit() {
    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));

    this.tabSettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: TabSettingsModel) => (this.tabSettings = settings));

    this.streamDetails$ = this.appStore.pipe(select(streamsDetailsStateSelector));

    this.appStore
      .pipe(
        select(getActiveTab),
        filter((t) => !!t),
        distinctUntilChanged((t1, t2) => t1?.id === t2?.id),
        debounceTime(0),
        switchMap((tab: TabModel) =>
          combineLatest([
            this.streamsService.rangeCached(tab.stream, tab.symbol, tab.space),
            this.streamsService.getListWithUpdates().pipe(
              map((streams) => streams.find((s) => tab.stream === s.key)),
              filter(Boolean),
            ),
          ]).pipe(
            take(1),
            map(([range, stream]) => ({range, tab, stream})),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(({range: {start, end}, tab, stream}) => {
        const startNum = new HdDate(start).getEpochMillis();
        const endNum = new HdDate(end).getEpochMillis();

        tab.streamRange = {
          start: startNum,
          end: endNum,
        };

        Object.keys(stream).forEach((key) => {
          tab[key] = stream[key];
        });

        let CHART_WIDTH_VAL: string | number = this.widthValuesMs[3].val as number,
          DATE_FROM = endNum - CHART_WIDTH_VAL;

        if (DATE_FROM < startNum) {
          DATE_FROM = startNum;
          CHART_WIDTH_VAL = this.widthValuesMs[0].val;
        }

        tab.filter = {
          to: new Date(endNum).toISOString(),
          from: new Date(DATE_FROM).toISOString(),
          chart_width_val: CHART_WIDTH_VAL,
          ...tab.filter,
        };

        this.appStore.dispatch(new StreamsTabsActions.AddTab({tab}));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  public onHideErrorMessage() {
    this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
  }
}
