import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  Data,
}                                                                                                  from '@angular/router';
import { HdDate }                                                                                  from '@deltix/hd-date';
import { select, Store }                                                                           from '@ngrx/store';
import {
  BsModalRef,
  BsModalService,
}                                                                                                  from 'ngx-bootstrap/modal';
import { Observable, Subject, Subscription }                                                       from 'rxjs';
import {
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  withLatestFrom,
}                                                                                                  from 'rxjs/operators';
import { WebsocketService }                                                                        from '../../../../core/services/websocket.service';
import { AppState }                                                                                from '../../../../core/store';
import { FilterModel }                                                                             from '../../models/filter.model';
import { TabModel }                                                                                from '../../models/tab.model';
import * as StreamDetailsActions
                                                                                                   from '../../store/stream-details/stream-details.actions';
import * as fromStreamDetails
                                                                                                   from '../../store/stream-details/stream-details.reducer';
import {
  getStreamOrSymbolByID,
  streamsDetailsStateSelector,
}                                                                                                  from '../../store/stream-details/stream-details.selectors';
import * as fromStreams
                                                                                                   from '../../store/streams-list/streams.reducer';
import { State as ListState }                                                                      from '../../store/streams-list/streams.reducer';
import {
  getOpenNewTabState,
  getStreamsList,
  streamsListStateSelector,
}                                                                                                  from '../../store/streams-list/streams.selectors';
import * as StreamsTabsActions
                                                                                                   from '../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
  getTabs,
}                                                                                                  from '../../store/streams-tabs/streams-tabs.selectors';
import { ModalCellJSONComponent }                                                                  from '../modals/modal-cell-json/modal-cell-json.component';

// Stayed for chart component now, toUtc, fromUtc
const now = new HdDate();

export const toUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() + now.getTimezoneOffset() * 60 * 1000);
  return newDate;
};

export const formatDate = (date: any, format: string): string => {
  const newDate = new HdDate(date);
  return newDate.toLocaleFormat(format);
};

export const fromUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() - now.getTimezoneOffset() * 60 * 1000);
  return newDate;
};

@Component({
  selector: 'app-stream-details',
  templateUrl: './stream-details.component.html',
  styleUrls: ['./stream-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class StreamDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
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

  constructor(
    private appStore: Store<AppState>,
    private route: ActivatedRoute,
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private modalService: BsModalService,
    private wsService: WebsocketService,
    private CDRef: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
    this.streamDetails = this.streamDetailsStore.pipe(select(streamsDetailsStateSelector));

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
              withLatestFrom(this.route.data),
              filter(([params, data]: [{ stream: string, id: string, symbol?: string }, Data]) => !!params.stream),
              switchMap(([params, data]: [{ stream: string, id: string, symbol?: string }, Data]) => {
                return this.appStore
                  .pipe(
                    select(getStreamOrSymbolByID, {streamID: params.stream, symbol: params.symbol, uid: params.id}),
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
        this.streamDetailsStore.dispatch(new StreamDetailsActions.GetSymbols({streamId: tabModel.stream}));
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
        if (!tabsItemEquilPrev && prevActTab && activeTabId !== tab.id && !this.isOpenInNewTab && tab.type !== 'query' && prevActTab.type !== 'query') {
          prevActTab['live'] = false;
          this.streamsStore.dispatch(new StreamsTabsActions.RemoveTab({
            tab: prevActTab,
          }));
        }

        localStorage.setItem('prevActTab', JSON.stringify(tab));
      });

  }


  cleanWebsocketSubscription() {
    this.wsService.close();
  }

  closedPropsEmit($event) {
    if (this.closedProps !== $event) {
      this.closedProps = $event;
    }
  }

  public onHideErrorMessage() {
    this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
  }


  openModalCellJSON(params: any) {
    const initialState = {
      title: 'Viewer of JSON Data',
      data: params.value,
    };
    this.bsModalRef = this.modalService.show(ModalCellJSONComponent, {initialState});
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
