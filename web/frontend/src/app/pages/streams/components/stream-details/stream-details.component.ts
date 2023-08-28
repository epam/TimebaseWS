import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  Data,
  Params,
}                                                                         from '@angular/router';
import { HdDate }                                                         from '@assets/hd-date/hd-date';
import { select, Store }                                                  from '@ngrx/store';
import { BsModalRef }                                                     from 'ngx-bootstrap/modal';
import { Observable, Subject, Subscription }                              from 'rxjs';
import { filter, map, switchMap, take, takeUntil, withLatestFrom }        from 'rxjs/operators';
import { WebsocketService }                                               from '../../../../core/services/websocket.service';
import { AppState }                                                       from '../../../../core/store';
import { RightPaneService }                                               from '../../../../shared/right-pane/right-pane.service';
import { TabStorageService }                                              from '../../../../shared/services/tab-storage.service';
import { FilterModel }                                                    from '../../models/filter.model';
import { TabModel }                                                       from '../../models/tab.model';
import { TabSettingsModel }                                               from '../../models/tab.settings.model';
import * as StreamDetailsActions
                                                                          from '../../store/stream-details/stream-details.actions';
import * as fromStreamDetails
                                                                          from '../../store/stream-details/stream-details.reducer';
import {
  getStreamOrSymbolByID,
  streamsDetailsStateSelector,
}                                                                         from '../../store/stream-details/stream-details.selectors';
import * as fromStreams
                                                                          from '../../store/streams-list/streams.reducer';
import { State as ListState }                                             from '../../store/streams-list/streams.reducer';
import {
  getOpenNewTabState,
  getStreamsList,
  streamsListStateSelector,
}                                                                         from '../../store/streams-list/streams.selectors';
import * as StreamsTabsActions
                                                                          from '../../store/streams-tabs/streams-tabs.actions';
import { RemoveTab }                                                      from '../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
  getActiveTabSettings,
  getTabs,
}                                                                         from '../../store/streams-tabs/streams-tabs.selectors';

// Stayed for chart component now, toUtc, fromUtc
const now = new HdDate();

export const toUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() + new Date().getTimezoneOffset() * 60 * 1000);
  return newDate;
};

export const formatDate = (date: any, format: string): string => {
  if (!format) {
    return null;
  }
  const newDate = new HdDate(date);
  return newDate.toLocaleFormat(format);
};

export const fromUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() - new Date().getTimezoneOffset() * 60 * 1000);
  return newDate;
};

@Component({
  selector: 'app-stream-details',
  templateUrl: './stream-details.component.html',
  styleUrls: ['./stream-details.component.scss'],
  providers: [TabStorageService, RightPaneService],
})
export class StreamDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  closedProps = true;
  bsModalRef: BsModalRef;
  schema = [];
  symbols = [];
  streamName: string;
  tabName: string;
  activeTab$: Observable<TabModel>;
  live: boolean;
  websocketSub: Subscription;
  tabSettings$: Observable<TabSettingsModel>;
  tabSettings: TabSettingsModel = {};
  error$: Observable<string>;

  private destroy$ = new Subject();
  private tabFilter;
  private isOpenInNewTab: boolean;
  private currentPosition;
  private currentTab: TabModel;

  constructor(
    private appStore: Store<AppState>,
    private route: ActivatedRoute,
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private wsService: WebsocketService,
    private CDRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.activeTab$ = this.appStore.pipe(select(getActiveOrFirstTab));

    this.activeTab$
      .pipe(take(1))
      .subscribe(() => this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage()));

    this.error$ = this.streamDetailsStore
      .pipe(select(streamsDetailsStateSelector))
      .pipe(map((details) => details.errorMessage));

    this.tabSettings$ = this.appStore.pipe(select(getActiveTabSettings));

    this.tabSettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings: TabSettingsModel) => (this.tabSettings = settings));

    this.appStore
      .pipe(select(getOpenNewTabState))
      .subscribe((_openNewTab) => (this.isOpenInNewTab = _openNewTab));
    this.appStore
      .pipe(
        select(streamsListStateSelector),
        filter(() => !!this.currentTab),
        takeUntil(this.destroy$),
      )
      .subscribe((listState: ListState) => {
        if (listState.dbState) {
          if (listState.dbState.renamed && listState.dbState.renamed.length) {
            const eqItem = listState.dbState.renamed.find((item) => item.oldName === this.tabName);
            if (eqItem) {
              const tab = new TabModel({...{}, ...this.currentTab});
              tab.stream = eqItem.newName;
              this.streamsStore.dispatch(
                new StreamsTabsActions.AddTab({
                  tab: tab,
                  position: this.currentPosition,
                }),
              );
              this.streamsStore.dispatch(
                new StreamsTabsActions.RemoveTab({
                  tab: this.currentTab,
                }),
              );
            }
          }

          if (
            (listState.dbState.added &&
              listState.dbState.added.find((item) => item === this.tabName)) ||
            (listState.dbState.changed &&
              listState.dbState.changed.find((item) => item === this.tabName))
          ) {
            this.appStore.dispatch(new StreamsTabsActions.SetFilters({filter: this.tabFilter}));
          }
        }
      });

    this.appStore
      .pipe(
        select(getActiveTabFilters),
        filter((filter) => !!filter),
        takeUntil(this.destroy$),
      )
      .subscribe((filter: FilterModel) => {
        this.tabFilter = {...filter};
      });

    this.appStore
      .pipe(
        select(getStreamsList),
        filter((streams) => !!streams),
        switchMap(() => this.appStore.pipe(select(getTabs))),
        filter((tabs) => !!tabs),
        withLatestFrom(
          this.appStore.pipe(
            select(getActiveTab),
            map((activeTab) => (activeTab ? activeTab.id : '')),
          ),
        ),
        take(1),
        takeUntil(this.destroy$),
        switchMap(([tabs, activeTabId]: [TabModel[], string]) => {
          return this.route.params.pipe(
            filter((params: {stream: string; id: string; symbol?: string}) => !!params.stream),
            withLatestFrom(this.route.data),
            withLatestFrom(this.route.queryParams),
            switchMap(
              ([[params, data], queryParams]: [
                [{stream: string; id: string; symbol?: string}, Data],
                Params,
              ]) => {
                return this.appStore.pipe(
                  select(getStreamOrSymbolByID, {
                    streamID: params.stream,
                    symbol: params.symbol,
                    uid: params.id,
                    space: queryParams.space,
                  }),
                  filter((tabModel: TabModel) => !!tabModel),
                  take(1),
                  map((tabModel: TabModel) => {
                    return [tabModel, data, tabs, activeTabId];
                  }),
                );
              },
            ),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(([tabModel, data, tabs, activeTabId]: [TabModel, Data, TabModel[], string]) => {
        this.streamDetailsStore.dispatch(
          new StreamDetailsActions.GetSymbols({
            streamId: tabModel.stream,
            ...(tabModel.space ? {spaceId: tabModel.space} : {}),
          }),
        );
        this.live = data.hasOwnProperty('live');
        this.streamName = tabModel.stream;
      });
  }

  closeTab() {
    this.activeTab$.pipe(take(1)).subscribe((tab) => this.appStore.dispatch(new RemoveTab({tab})));
  }

  cleanWebsocketSubscription() {
    this.wsService.close();
  }

  ngOnDestroy(): void {
    this.cleanWebsocketSubscription();
    this.destroy$.next(true);
    this.destroy$.complete();
    this.streamsStore.dispatch(new StreamDetailsActions.StopSubscriptions());
    this.CDRef.detach();
  }

  ngAfterViewInit(): void {
    this.CDRef.detectChanges();
  }
}
