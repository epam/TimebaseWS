import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild }        from '@angular/core';
import { select, Store }                                                           from '@ngrx/store';
import { StompHeaders }                                                            from '@stomp/stompjs';
import { AgGridModule }                                                            from 'ag-grid-angular';
import {
  CellClickedEvent,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridOptions,
  GridReadyEvent,
  PinnedRowDataChangedEvent,
}                                                                                  from 'ag-grid-community';
import * as Diff                                                                   from 'fast-deep-equal';
import { BsModalRef, BsModalService }                                              from 'ngx-bootstrap/modal';
import { combineLatest, Observable, Subject, Subscription, timer }                 from 'rxjs';
import { distinctUntilChanged, filter, map, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { WebsocketService }                                                        from '../../../../core/services/websocket.service';
import { WSService }                                                               from '../../../../core/services/ws.service';
import { AppState }                                                                from '../../../../core/store';
import { getAppVisibility }                                                        from '../../../../core/store/app/app.selectors';
import { GridContextMenuService }                                                  from '../../../../shared/grid-components/grid-context-menu.service';
import { GridEventsService }                                                       from '../../../../shared/services/grid-events.service';
import { GridService }                                                             from '../../../../shared/services/grid.service';
import {
  autosizeAllColumns,
  columnIsMoved,
  columnIsPinned,
  columnIsVisible,
  columnsVisibleColumn,
  defaultGridOptions,
  getContextMenuItems,
  gridStateLSInit,
}                                                                                  from '../../../../shared/utils/grid/config.defaults';
import { FilterModel }                                                             from '../../models/filter.model';
import { GridStateModel }                                                          from '../../models/grid.state.model';
import { StreamDetailsModel }                                                      from '../../models/stream.details.model';
import { TabModel }                                                                from '../../models/tab.model';
import { WSLiveModel }                                                             from '../../models/ws-live.model';
import {
  CleanSelectedMessage,
  SetSelectedMessage,
}                                                                                  from '../../store/seletcted-message/selected-message.actions';
import { getSelectedMessage }                                                      from '../../store/seletcted-message/selected-message.selectors';
import * as StreamDetailsActions
                                                                                   from '../../store/stream-details/stream-details.actions';
import { StreamDetailsEffects }                                                    from '../../store/stream-details/stream-details.effects';
import * as fromStreamDetails
                                                                                   from '../../store/stream-details/stream-details.reducer';
import { State as DetailsState }                                                   from '../../store/stream-details/stream-details.reducer';
import {
  getStreamGlobalFilters,
  streamsDetailsStateSelector,
}                                                                                  from '../../store/stream-details/stream-details.selectors';
import * as fromStreamProps
                                                                                   from '../../store/stream-props/stream-props.reducer';
import * as fromStreams
                                                                                   from '../../store/streams-list/streams.reducer';
import {
  getActiveOrFirstTab,
  getActiveTabFilters,
}                                                                                  from '../../store/streams-tabs/streams-tabs.selectors';

@Component({
  selector: 'app-streams-grid-live',
  templateUrl: './streams-grid-live.component.html',
  styleUrls: ['./streams-grid-live.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GridService, GridContextMenuService],
})
export class StreamsGridLiveComponent implements OnInit, OnDestroy {
  public websocketSub: Subscription;
  private wsUnsubscribe$ = new Subject();
  public schema = [];
  // public rowData = new Map();
  private subIsInited: boolean;
  @ViewChild('streamDetailsGridLive', {static: true}) agGrid: AgGridModule;

  public bsModalRef: BsModalRef;
  public gridOptions: GridOptions;
  private destroy$ = new Subject();
  private readyApi: GridOptions;
  private filter_date_format = [];
  private filter_time_format = [];
  private filter_timezone = [];
  private gridStateLS: GridStateModel = {visibleArray: [], pinnedArray: [], resizedArray: []};
  private tabFilter;
  private subscribeTimer;
  public tabName: string;
  private tabData: TabModel;
  private symbolName = '';
  private prevsSocketData: WSLiveModel = {
    messageType: '', fromTimestamp: null, symbols: null, types: null,
  };
  public selectedMessage$: Observable<StreamDetailsModel>;

  private intervalUpdate;
  // private propsState: Observable<fromStreamProps.State>;
  private gridDefaults: GridOptions = {
    ...defaultGridOptions,
    rowBuffer: 10,
    enableFilter: true,
    enableCellChangeFlash: true,
    enableSorting: true,

    suppressRowClickSelection: false,
    rowSelection: 'multiple',
    gridAutoHeight: false,
    suppressNoRowsOverlay: true,
    animateRows: false,
    onCellDoubleClicked: (event) => {
      event.api.setPinnedTopRowData([event.data]);
    },
    onCellClicked: (event: CellClickedEvent) => {
      if (event.rowPinned) {
        this.selectedMessage$
          .pipe(
            take(1),
            takeUntil(this.destroy$),
          )
          .subscribe(message => {
            if (message === null) {
              this.appStore.dispatch(SetSelectedMessage({selectedMessage: event.data}));
            }
          });
      }
    },
    onPinnedRowDataChanged: (event: PinnedRowDataChangedEvent) => {
      if (event.api.getPinnedTopRowCount() > 0) {
        const PINNED_ROW = event.api.getPinnedTopRow(0);
        this.appStore.dispatch(SetSelectedMessage({selectedMessage: PINNED_ROW.data}));
      }
    },
    onGridReady: (readyEvent: GridReadyEvent) => this.gridIsReady(readyEvent),
    onModelUpdated: (params) => {
      autosizeAllColumns(params.columnApi);
      if (this.gridStateLS.resizedArray.length) {
        for (const item of this.gridStateLS.resizedArray) {
          params.columnApi.setColumnWidth(item.colId, item.actualWidth, true);
        }
      }
    },
    onColumnResized: (resizedEvent: ColumnResizedEvent) => this.gridEventsService.columnIsResized(resizedEvent, this.tabName, this.gridStateLS),
    onColumnVisible: (visibleEvent: ColumnVisibleEvent) => columnIsVisible(visibleEvent, this.tabName, this.gridStateLS),
    onColumnMoved: (movedEvent: ColumnMovedEvent) => columnIsMoved(movedEvent, this.tabName, this.gridStateLS),
    onColumnPinned: (pinnedEvent: ColumnPinnedEvent) => columnIsPinned(pinnedEvent, this.tabName, this.gridStateLS),

    getContextMenuItems: getContextMenuItems.bind(this),
    getRowNodeId: data => {
      // const id = data.symbol;
      return data.symbol;
    },
  };

  constructor(
    private appStore: Store<AppState>,
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private streamDetailsEffects: StreamDetailsEffects,
    private modalService: BsModalService,
    private websocketService: WebsocketService,
    private wsService: WSService,
    private streamPropsStore: Store<fromStreamProps.FeatureState>,
    private gridEventsService: GridEventsService,
    private gridService: GridService,
    private gridContextMenuService: GridContextMenuService,
  ) { }

  ngOnInit() {
    this.gridOptions = {
      ...this.gridDefaults,
      rowData: [], // TODO: test fix of issue https://gitlab.deltixhub.com/Deltix/QuantServer/TimebaseWS/issues/81
    };
    this.selectedMessage$ = this.appStore.pipe(select(getSelectedMessage));
  
    this.gridContextMenuService.addColumnMenuItems([
      {
        data: event => ({
          name: 'Autosize This Column',
          action: () => {
            event.columnApi.autoSizeColumn(event.column);
            const filtered = this.gridStateLS.resizedArray.filter(item => item.colId !== event.column.getColId());
            this.gridStateLS.resizedArray = [...filtered];
            localStorage.setItem('gridStateLS' + this.tabName, JSON.stringify(this.gridStateLS));
          },
        }),
        alias: 'autosize',
      },
      {
        data: event => ({
          name: 'Autosize All Columns',
          action: () => {
            autosizeAllColumns(event.columnApi);
            this.gridStateLS.resizedArray = [];
            localStorage.setItem('gridStateLS' + this.tabName, JSON.stringify(this.gridStateLS));
          },
        }),
        alias: 'autosizeAll',
      },
      {
        data: event => ({
          name: 'Reset Columns',
          action: () => {
            this.gridStateLS = {visibleArray: [], pinnedArray: [], resizedArray: []};
            localStorage.removeItem('gridStateLS' + this.tabName);
            if (this.subIsInited) {
              event.columnApi.resetColumnState();
              timer(100).subscribe(() => autosizeAllColumns(event.columnApi));
            }
          },
        }),
        alias: 'reset',
      },
    ]);
    
    this.appStore
      .pipe(
        select(getStreamGlobalFilters),
        filter(global_filter => !!global_filter),
        takeUntil(this.destroy$),
        distinctUntilChanged(),
      )
      .subscribe((action => {
          if (action.filter_date_format && action.filter_date_format.length) {
            this.filter_date_format = [...action.filter_date_format];
          } else {
            this.filter_date_format = [];
          }
          if (action.filter_time_format && action.filter_time_format.length) {
            this.filter_time_format = [...action.filter_time_format];
          } else {
            this.filter_time_format = [];
          }
          if (action.filter_timezone && action.filter_timezone.length) {
            this.filter_timezone = [...action.filter_timezone];
          } else {
            this.filter_timezone = [];
          }

        }
      ));
  }

  createWebsocketSubscription(url: string, dataObj: WSLiveModel) {
    // this.rowData = new Map();
    this.subIsInited = true;
    // example url 'ws://localhost:8099/ws/v0/securities/select?from=2018-07-11T00:00:00.000Z&live=true'

    // this.websocketSub = this.websocketService
    const stompHeaders: StompHeaders = {};
    Object.keys(dataObj).forEach(key => {
      if (typeof dataObj[key] !== 'object') {
        stompHeaders[key] = dataObj[key] + '';
      } else if (dataObj[key] && typeof dataObj[key] === 'object') {
        stompHeaders[key] = JSON.stringify(dataObj[key]);
      }
    });
    this.wsService
      .watch(url, stompHeaders, {destination: url})
      .pipe(
        withLatestFrom(this.appStore.select(getAppVisibility)),
        filter(([ws_data, app_is_visible]: [any, boolean]) => app_is_visible && !!(this.readyApi && this.readyApi.api)),
        map(([ws_data]) => ws_data),
        takeUntil(this.wsUnsubscribe$),
      )
      .subscribe((data: any) => {
        const GRID_API = this.readyApi.api;
        const addRows = [], updateRows = [];
        const parseData: [] = JSON.parse(data.body);
        parseData.forEach(row => {
          if (GRID_API.getRowNode(row['symbol'])) {
            updateRows.push(new StreamDetailsModel(row));
          } else {
            addRows.push(new StreamDetailsModel(row));
          }
        });
        // const newRowData = [];
        // this.rowData.forEach(row => {
        //   const rowStreamModel = new StreamDetailsModel(row);
        //   newRowData.push(rowStreamModel);
        // });
        this.readyApi.api.updateRowData({
          add: addRows,
          update: updateRows,
        });
      });
  }

  cleanWebsocketSubscription() {
    clearInterval(this.intervalUpdate);
    this.wsUnsubscribe$.next(true);
    this.wsUnsubscribe$.complete();
    this.wsUnsubscribe$ = new Subject();
  }


  private gridIsReady(readyEvent: GridReadyEvent) {
    this.readyApi = {...readyEvent};
    this.gridService.setTooltipDelay(readyEvent);
    this.appStore
      .pipe(
        select(getActiveTabFilters),
        filter((filter) => !!filter),
        takeUntil(this.destroy$),
      )
      .subscribe((filter: FilterModel) => {
        this.tabFilter = {...filter};
        this.readyApi.api.setPinnedTopRowData([]);
      });

    this.streamDetailsEffects
      .setSchema
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe(action => {
        if (!action.payload.schema) {
          return;
        }
        if (action.payload.schema && action.payload.schema.length) {
          this.schema = [...action.payload.schema];
        }
        const hideAllColumns = false;
        const props = [
          columnsVisibleColumn(),
          {
            headerName: 'Symbol',
            tooltipField: 'symbol',
            field: 'symbol',
            pinned: 'left',
            filter: false,
            sortable: false,
            width: 100,
            headerTooltip: 'Symbol',
          },
          {
            headerName: 'Timestamp',
            field: 'timestamp',
            pinned: 'left',
            filter: false,
            sortable: false,
            width: 160,
            headerTooltip: 'Timestamp',
            cellRenderer: params => this.gridService.dateFormat(params),
            tooltipValueGetter: params => this.gridService.dateFormat(params),
          },
          {
            headerName: 'Type',
            field: '$type',
            pinned: 'left',
            filter: false,
            sortable: false,
            headerTooltip: 'Type',
            hide: true,
          },
          ...this.gridService.columnFromSchema(action.payload.schema, hideAllColumns),
        ];
        readyEvent.api.setColumnDefs(null);
        readyEvent.api.setColumnDefs(props);
        this.gridStateLS = gridStateLSInit(readyEvent.columnApi, this.tabName, this.gridStateLS);

        if (this.tabFilter && this.tabFilter.filter_types && this.readyApi && this.readyApi.columnApi && this.readyApi.columnApi.getAllColumns() && this.readyApi.columnApi.getAllColumns().length) {

          const columns = [...this.readyApi.columnApi.getAllColumns()];
          const filter_types_arr = this.tabFilter.filter_types;
          const columnsVisible = [];
          for (let j = 0; j < filter_types_arr.length; j++) {
            for (let i = 0; i < columns.length; i++) {

              if (String(columns[i]['colId']).indexOf(String(filter_types_arr[j]).replace(/\./g, '-')) !== -1) {
                columnsVisible.push(columns[i]['colId']);
              } else if (columns[i]['colId'] !== '0' &&
                columns[i]['colId'] !== 'symbol' &&
                columns[i]['colId'] !== 'timestamp') {
                this.readyApi.columnApi.setColumnVisible(columns[i]['colId'], false);
              }
            }
          }
          for (const col of columnsVisible) {
            this.readyApi.columnApi.setColumnVisible(col, true);
          }
        }
      });

    this.streamPropsStore
      .pipe(
        select('streamProps'),
        filter((props: any) => props && props.props),
        distinctUntilChanged(),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(props => {
        combineLatest([
            this.appStore
              .pipe(
                select(getActiveOrFirstTab),
                filter((tab: TabModel) => tab && tab.live),
                distinctUntilChanged((prevTabModel: TabModel, nextTabModel: TabModel) => {
                  const PREV = new TabModel(prevTabModel);
                  const NEXT = new TabModel(nextTabModel);
                  delete PREV.tabSettings;
                  delete NEXT.tabSettings;
                  return Diff(PREV, NEXT);
                }),
                tap((tab) => {
                  this.streamsStore.dispatch(new StreamDetailsActions.GetSchema({streamId: tab.stream}));
                }),
              ),
            this.appStore
              .pipe(
                select(streamsDetailsStateSelector),
                filter((state: DetailsState) => !!state.schema),
                // distinctUntilChanged((p: DetailsState, q: DetailsState) => p.schema === q.schema || p.filter_types === q.filter_types || p.filter_symbols === q.filter_symbols),
              ),
          ],
        )
          .pipe(
            tap(() => {
              //   this.readyApi.api.setRowData(null);
            }),
            takeUntil(this.destroy$),
            distinctUntilChanged(),
          )
          .subscribe(([tab, action]: [TabModel, DetailsState]) => {
            this.tabData = tab;
            this.tabName = tab.stream;
            if (tab.symbol) {
              this.symbolName = tab.symbol;
            }
            if (tab.id) this.tabName += tab.id;
            if (this.subscribeTimer) {
              clearTimeout(this.subscribeTimer);
              delete this.subscribeTimer;
            }
            this.cleanWebsocketSubscription();
            if (this.readyApi && this.readyApi.api) {
              this.readyApi.api.setRowData([]);
            }

            this.subscribeTimer = setTimeout(() => {

              const socketData: WSLiveModel = {
                fromTimestamp: null,
              };

              if (tab.symbol) {
                socketData.symbols = [tab.symbol];
              }

              if (tab.filter.filter_symbols && tab.filter.filter_symbols.length) {
                socketData.symbols = tab.filter.filter_symbols;
              }
              if (tab.filter.filter_types && tab.filter.filter_types.length) {
                socketData.types = tab.filter.filter_types;
              }
              if (tab.space && tab.space) {
                socketData.space = tab.space;
              }

              if (tab.filter && tab.filter['from'] && tab.filter['from'].length) {
                socketData.fromTimestamp = tab.filter.from;
              } else if (props.props && props.props.range && props.props.range['end']) {
                const dateEnd = new Date(props.props.range['end']).getTime() + 1;
                socketData.fromTimestamp = (new Date(dateEnd)).toISOString();
              }

              this.createWebsocketSubscription(`/user/topic/monitor/${escape(tab.stream)}`,
                socketData,
              );
            }, 500);
          });

      });
  }

  sendMessage(socketData: WSLiveModel) {
    if (this.readyApi && this.readyApi.api) {
      this.readyApi.api.setRowData([]);
    }
    // this.rowData = new Map();
    this.websocketService.send(socketData);
  }

  ngOnDestroy(): void {
    this.cleanWebsocketSubscription();
    this.destroy$.next(true);
    this.destroy$.complete();
    this.streamsStore.dispatch(new StreamDetailsActions.StopSubscriptions());
    this.appStore.dispatch(CleanSelectedMessage());
  }

}
