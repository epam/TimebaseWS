import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {UntypedFormBuilder} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {HdDate} from '@assets/hd-date/hd-date';
import {select, Store} from '@ngrx/store';

import {combineLatest, Observable, Subject} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  tap, 
  pluck, 
  withLatestFrom
}                                from 'rxjs/operators';
import { TabNavigationService } from 'src/app/shared/services/tab-navigation.service';
import { eventKeyMatchesTarget } from 'src/app/shared/utils/eventKeyMatchesTarget';
import {AppState}                from '../../../../../core/store';
import {RightPaneService}        from '../../../../../shared/right-pane/right-pane.service';
import { LinearChartService }    from '../../../../../shared/services/linear-chart.service';
import {StorageService}          from '../../../../../shared/services/storage.service';
import {StreamsService}          from '../../../../../shared/services/streams.service';
import {TabStorageService}       from '../../../../../shared/services/tab-storage.service';
import {WIDTH_VALUES_MS}         from '../../../models/filter.model';
import {TabModel}                from '../../../models/tab.model';
import {TabSettingsModel}        from '../../../models/tab.settings.model';
import {ChartExchangeService}    from '../../../services/chart-exchange.service';
import {ChartTrackService}       from '../../../services/chart-track.service';
import * as StreamDetailsActions from '../../../store/stream-details/stream-details.actions';
import * as fromStreamDetails    from '../../../store/stream-details/stream-details.reducer';
import {streamsDetailsStateSelector} from '../../../store/stream-details/stream-details.selectors';
import * as StreamsTabsActions       from '../../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveTab,
  getActiveOrFirstTab,
  getActiveTabSettings,
}                                    from '../../../store/streams-tabs/streams-tabs.selectors';
import {DeltixChartFeedService}      from '../chart-parts/detix-chart-feed.service';
import { ChartsFilterComponent } from '../charts-filter/charts-filter.component';
import {DeltixChartsComponent} from '../charts/deltix-charts.component';
import { ChartService } from 'src/app/shared/services/chart-service';
import { StreamRenameService } from '../../../services/stream-rename.service';

@Component({
  selector: 'app-charts-layout',
  templateUrl: './charts-layout.component.html',
  styleUrls: ['./charts-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ChartTrackService,
    DeltixChartFeedService,
    TabStorageService,
    RightPaneService,
    ChartExchangeService,
  ],
})
export class ChartsLayoutComponent implements OnInit, OnDestroy {
  @ViewChild(DeltixChartsComponent) deltixChartsComponent: DeltixChartsComponent;
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
  public closedProps: boolean;
  @ViewChild('btn') btn: ElementRef;
  public widthValuesMs = WIDTH_VALUES_MS;
  private destroy$ = new Subject();
  private streamId: string;
  public currentTab$: Observable<TabModel>;
  private symbolName: string;
  symbolList: string[];
  noChart: boolean;

  @ViewChild(ChartsFilterComponent) chartsFilter: ChartsFilterComponent;
  @HostListener('keydown', ['$event']) onArrowKeyDown(event: KeyboardEvent) {
    if (eventKeyMatchesTarget(event.key, ['ArrowLeft', 'ArrowRight'])) {
      this.chartsFilter.switchTimeRange(event.key === 'ArrowLeft' ? -1 : 1);
      event.preventDefault();
    }
  }

  constructor(
    private appStore: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private fb: UntypedFormBuilder,
    private storageService: StorageService,
    private streamsService: StreamsService,
    private chartService: ChartService,
    private streamRenameService: StreamRenameService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));

    this.tabSettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: TabSettingsModel) => this.tabSettings = settings);

    this.streamDetails$ = this.appStore.pipe(select(streamsDetailsStateSelector));

    this.currentTab$ = this.appStore.pipe(select(getActiveOrFirstTab));

    this.currentTab$.pipe(
      filter(tab => tab && !!tab.id),
      pluck('id'),
      withLatestFrom(this.chartService.openSymbols$),
      takeUntil(this.destroy$)
    ).subscribe(([tabId, symbols]) => this.symbolList = symbols[tabId]);

    this.appStore
      .pipe(
        select(getActiveTab),
        tap(tab => {
          this.noChart = !tab?.chartType?.length;
          if (this.noChart) {
            this.streamsService.chartLoaded$.next();
          } else {
            this.cdRef.markForCheck();
          }
        }),
        filter(tab => tab && !!tab.symbol && !!tab?.chartType?.length),
        distinctUntilChanged((t1, t2) => {
          return t1?.id === t2?.id;
        }),
        tap(() => this.deltixChartsComponent?.destroyChart()),
        debounceTime(0),
        switchMap((tab: TabModel) => {

          if (!this.streamId) {
            this.streamId = tab.stream;
          }
          if (!this.symbolList?.length) {
            this.symbolList = tab.symbol.split(',');
          }
          if (!this.symbolName) {
            this.symbolName = this.symbolList?.[0];
          }

          return combineLatest([
            this.streamsService.rangeCached(tab.stream, tab.symbol.split(',')[0], tab.space),
            this.streamsService.getListWithUpdates().pipe(
              map((streams) => streams.find((s) => tab.stream === s.key)),
              filter(Boolean),
            ),
          ]).pipe(
            take(1),
            map(([range, stream]) => ({range, tab, stream})),
          );
        }),
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
          if (['chartType'].includes(key)) {
            return;
          }
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

        const savedSymbols = this.chartService.getSavedSymbolList(tab.id) as string[];

        if (savedSymbols?.length && JSON.stringify(savedSymbols) !== JSON.stringify(this.symbolList)) {
          this.symbolList = [...savedSymbols];
        }
      });

    this.streamRenameService
      .onSymbolRenamed()
      .pipe(withLatestFrom(this.currentTab$), takeUntil(this.destroy$))
      .subscribe(([{ streamId, oldName, newName }, currentTab]) => {
        if (currentTab.stream === streamId && this.symbolList.includes(oldName)) {
          this.symbolList = [ ...this.symbolList.filter(name => name !== oldName), newName];
          this.chartService.updateSavedSymbolList(currentTab.id, this.symbolList);
        }
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  public onHideErrorMessage() {
    this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
  }

  setSymbolList(list: string[]) {
    if (JSON.stringify(list) !== JSON.stringify(this.symbolList)) {
      this.symbolList = list;
    }
  }
}
