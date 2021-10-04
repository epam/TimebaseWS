import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  Data,
  Params,
}                                                                  from '@angular/router';
import { select, Store }                                           from '@ngrx/store';
import {
  BsModalRef,
  BsModalService,
}                                                                  from 'ngx-bootstrap/modal';
import { Observable, Subject, Subscription }                       from 'rxjs';
import { filter, map, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { WebsocketService }                                        from '../../../../../../core/services/websocket.service';
import { AppState }                                                from '../../../../../../core/store';
import { StorageService }                                          from '../../../../../../shared/services/storage.service';
import { FilterModel }                                             from '../../../../models/filter.model';
import { StreamDetailsModel }                                      from '../../../../models/stream.details.model';
import { TabModel }                                                from '../../../../models/tab.model';
import { TabSettingsModel }                                        from '../../../../models/tab.settings.model';
import { getSelectedMessage }                                      from '../../../../store/seletcted-message/selected-message.selectors';
import * as StreamDetailsActions
                                                                   from '../../../../store/stream-details/stream-details.actions';
import * as fromStreamDetails
                                                                   from '../../../../store/stream-details/stream-details.reducer';
import {
  getStreamOrSymbolByID,
  streamsDetailsStateSelector,
}                                                                  from '../../../../store/stream-details/stream-details.selectors';
import * as fromStreams
                                                                                from '../../../../store/streams-list/streams.reducer';
import { State as ListState }                                                   from '../../../../store/streams-list/streams.reducer';
import {
  getOpenNewTabState,
  getStreamsList,
  streamsListStateSelector,
}                                                                               from '../../../../store/streams-list/streams.selectors';
import * as StreamsTabsActions
                                                                                from '../../../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
  getActiveTabSettings,
  getTabs,
}                                                                               from '../../../../store/streams-tabs/streams-tabs.selectors';


@Component({
  selector: 'app-monitor-log-layout',
  templateUrl: './monitor-log-layout.component.html',
  styleUrls: ['./monitor-log-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorLogLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  public closedProps = true;
  public bsModalRef: BsModalRef;
  public schema = [];
  public symbols = [];
  public streamName: string;
  public tabName: string;
  public streamDetails: Observable<fromStreamDetails.State>;
  public activeTab: Observable<TabModel>;
  private currentTab: TabModel;
  public live: boolean;
  private isOpenInNewTab: boolean;
  private currentPosition;
  public websocketSub: Subscription;
  private destroy$ = new Subject();
  private tabFilter;
  public tabSettings$: Observable<TabSettingsModel>;
  public tabSettings: TabSettingsModel = {};
  public selectedMessage: Observable<StreamDetailsModel>;
  private lastStream: string;

  constructor(
    private appStore: Store<AppState>,
    private route: ActivatedRoute,
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private modalService: BsModalService,
    private wsService: WebsocketService,
    private storageService: StorageService,
  ) {
  }

  ngOnInit() {
    this.streamDetails = this.streamDetailsStore.pipe(select(streamsDetailsStateSelector));
    this.selectedMessage = this.appStore.pipe(select(getSelectedMessage));

    this.activeTab = this.appStore.pipe(select(getActiveOrFirstTab));

    this.appStore.pipe(select(getOpenNewTabState)).subscribe(_openNewTab => this.isOpenInNewTab = _openNewTab);
    this.appStore
      .pipe(
        select(streamsListStateSelector),
        // filter((_openNewTab) => !!_openNewTab),
        filter(() => !!this.currentTab),
        // withLatestFrom(this.appStore
        //   .pipe(
        //     select(getStreamOrSymbolByID, {streamID: this.currentTab.stream, uid: this.currentTab.id, symbol: this.currentTab.symbol}),
        //     filter((tabModel: TabModel) => !!tabModel),
        //     take(1),
        //   )),
        takeUntil(this.destroy$),
      )
      // .subscribe(([listState, tabModel]: [ListState, TabModel]) => {
      .subscribe((listState: ListState) => {
        if (listState.dbState) {

          if (listState.dbState.renamed && listState.dbState.renamed.length) {
            const eqItem = listState.dbState.renamed.find(item => item.oldName === this.tabName);
            if (eqItem) {
              const tab = new TabModel({...{}, ...this.currentTab});
              tab.stream = eqItem.newName;
              this.streamsStore.dispatch(new StreamsTabsActions.AddTab({
                tab: tab,
                position: this.currentPosition,
              }));
              this.streamsStore.dispatch(new StreamsTabsActions.RemoveTab({
                tab: this.currentTab,
              }));

            }
          }

          if (listState.dbState.added.find(item => item === this.tabName) ||
            listState.dbState.changed.find(item => item === this.tabName)) {
            this.appStore.dispatch(new StreamsTabsActions.SetFilters({filter: this.tabFilter}));
          }

          if (listState.dbState.deleted.find(item => item === this.tabName)) {
            this.streamsStore.dispatch(new StreamsTabsActions.RemoveTab({
              tab: this.currentTab,
            }));
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

    this.tabSettings$ = this.appStore
      .pipe(
        select(getActiveTabSettings),
      );

    this.tabSettings$
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe((settings: TabSettingsModel) => this.tabSettings = settings);

    this.appStore
      .pipe(
        select(getStreamsList),
        filter(streams => !!streams),
        switchMap(() => this.appStore.pipe(select(getTabs))),
        filter((tabs) => !!tabs),
        withLatestFrom(this.appStore
          .pipe(
            select(getActiveTab),
            map(activeTab => activeTab ? activeTab.id : ''),
          )),
        take(1),
        takeUntil(this.destroy$),
        switchMap(([tabs, activeTabId]: [TabModel[], string]) => {
          return this.route.params
            .pipe(
              filter((params: { stream: string, id: string, symbol?: string }) => !!params.stream),
              withLatestFrom(this.route.data),
              withLatestFrom(this.route.queryParams),
              switchMap(([[params, data], queryParams]: [[{ stream: string, id: string, symbol?: string }, Data], Params]) => {
                return this.appStore
                  .pipe(
                    select(getStreamOrSymbolByID, {
                      streamID: params.stream,
                      symbol: params.symbol,
                      uid: params.id,
                      space: queryParams.space,
                    }),
                    filter((tabModel: TabModel) => !!tabModel),
                    take(1),
                    map((tabModel: TabModel) => {
                      return [
                        tabModel,
                        data,
                        tabs,
                        activeTabId,
                      ];
                    }),
                  );
              }),
            );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(([tabModel, data, tabs, activeTabId]: [TabModel, Data, TabModel[], string]) => {
        if (tabModel.stream && tabModel.stream !== this.lastStream) {
          this.lastStream = tabModel.stream;
          this.streamDetailsStore.dispatch(new StreamDetailsActions.GetSymbols({
            streamId: tabModel.stream,
            ...(tabModel.space ? {spaceId: tabModel.space} : {}),
          }));
        }
        this.live = data.hasOwnProperty('live');
        //  this.reverse = data.hasOwnProperty('reverse');
        this.streamName = tabModel.stream;
        if (!tabModel.stream) return;
        const tab: TabModel = new TabModel({
          ...tabModel,
          ...data,
          active: true,
        });

        this.tabName = tabModel.stream;
        if (tabModel.symbol) {
          this.tabName += tabModel.symbol;
        }
        //   this.streamDetailsStore.dispatch(new StreamDetailsActions.SetFilterState(this.tabName));
        const tabsItemEquilPrev = tabs.find(item => item.id === tab.id);
        let position = -1;
        if (!this.isOpenInNewTab && activeTabId) {
          position = tabs.map(e => e.id).indexOf(activeTabId);
        }
        this.currentPosition = position;
        this.streamsStore.dispatch(new StreamsTabsActions.AddTab({
          tab: tab,
          position: position,
        }));

        this.currentTab = Object.assign({}, tab);
        const prevActTab = tabs.find(tab => tab.id === activeTabId); // Don't remember why is it
        if (!tabsItemEquilPrev && prevActTab && activeTabId !== tab.id && !this.isOpenInNewTab
          && tab.type !== 'query' && prevActTab.type !== 'query'
          && tab.type !== 'flow' && prevActTab.type !== 'flow') {
          prevActTab['live'] = false;
          this.streamsStore.dispatch(new StreamsTabsActions.RemoveTab({
            tab: prevActTab,
          }));
        }

        this.storageService.setPreviousActiveTab(tab);
      });

  }


  cleanWebsocketSubscription() {
    this.wsService.close();
  }

  closedPropsEmit($event) {
    if (this.closedProps !== $event) {
      this.closedProps = $event;
    }
    this.appStore.dispatch(new StreamsTabsActions.SetTabSettings({
      tabSettings: {
        ...this.tabSettings,
        showProps: false,
      },
    }));
  }

  public onHideErrorMessage() {
    this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
  }
  
  ngOnDestroy(): void {
    this.cleanWebsocketSubscription();
    this.destroy$.next(true);
    this.destroy$.complete();
    this.streamsStore.dispatch(new StreamDetailsActions.StopSubscriptions());
    // this.CDRef.detach();
  }

  ngAfterViewInit(): void {
    // setTimeout(() => this.CDRef.detectChanges(), 1000);
  }

}
