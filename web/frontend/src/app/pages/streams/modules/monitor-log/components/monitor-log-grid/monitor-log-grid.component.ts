import { Component, OnDestroy, OnInit, ViewChild }                                        from '@angular/core';
import { select, Store }                                                                  from '@ngrx/store';
import { AgGridModule }                                                                   from 'ag-grid-angular';
import {
  CellClickedEvent,
  CellDoubleClickedEvent,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridOptions,
  GridReadyEvent,
  PinnedRowDataChangedEvent,
}                                                                                         from 'ag-grid-community';
import * as Diff                                                                          from 'fast-deep-equal';
import { BsModalRef, BsModalService }                                                     from 'ngx-bootstrap/modal';
import { combineLatest, Subject, Subscription, timer }                                    from 'rxjs';
import { distinctUntilChanged, filter, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { WebsocketService }                                                               from '../../../../../../core/services/websocket.service';
import { WSService }                                                                      from '../../../../../../core/services/ws.service';
import { AppState }                                                                       from '../../../../../../core/store';
import { GridContextMenuService }                                                         from '../../../../../../shared/grid-components/grid-context-menu.service';
import { SchemaTypesMap }                                                                 from '../../../../../../shared/models/schema.type.model';
import { RightPaneService }                                                               from '../../../../../../shared/right-pane/right-pane.service';
import { GlobalFiltersService }                                                           from '../../../../../../shared/services/global-filters.service';
import { GridEventsService }                                                              from '../../../../../../shared/services/grid-events.service';
import { GridService }                                                                    from '../../../../../../shared/services/grid.service';
import { StreamModelsService }                                                            from '../../../../../../shared/services/stream-models.service';
import { StreamsService }                                                                 from '../../../../../../shared/services/streams.service';
import {
  autosizeAllColumns,
  columnIsMoved,
  columnIsPinned,
  columnIsVisible,
  columnsVisibleColumn,
  defaultGridOptions,
  getContextMenuItems,
  gridStateLSInit,
}                                                                                         from '../../../../../../shared/utils/grid/config.defaults';
import { FilterModel }                                                                    from '../../../../models/filter.model';
import { GridStateModel }                                                                 from '../../../../models/grid.state.model';
import { TabModel }                                                                       from '../../../../models/tab.model';
import { WSLiveModel }                                                                    from '../../../../models/ws-live.model';
import * as StreamDetailsActions
                                                                                          from '../../../../store/stream-details/stream-details.actions';
import { StreamDetailsEffects }                                                           from '../../../../store/stream-details/stream-details.effects';
import * as fromStreamDetails
                                                                                          from '../../../../store/stream-details/stream-details.reducer';
import { State as DetailsState }                                                          from '../../../../store/stream-details/stream-details.reducer';
import { streamsDetailsStateSelector }                                                    from '../../../../store/stream-details/stream-details.selectors';
import * as fromStreams
                                                                                          from '../../../../store/streams-list/streams.reducer';
import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
  getActiveTabSettings,
}                                                                                         from '../../../../store/streams-tabs/streams-tabs.selectors';
import { MonitorLogGridDataService }                                                      from '../../services/monitor-log-grid-data.service';

@Component({
  selector: 'app-monitor-log-grid',
  templateUrl: './monitor-log-grid.component.html',
  styleUrls: ['./monitor-log-grid.component.scss'],
  providers: [GridService, GridContextMenuService],
})
export class MonitorLogGridComponent implements OnInit, OnDestroy {
  public websocketSub: Subscription;
  public schema = [];
  @ViewChild('streamDetailsGridLive', {static: true}) agGrid: AgGridModule;
  public bsModalRef: BsModalRef;
  public gridOptions: GridOptions;
  public tabName: string;
  private wsUnsubscribe$ = new Subject();
  private subIsInited: boolean;
  private destroy$ = new Subject();
  private readyApi: GridOptions;
  private filter_date_format = [];
  private filter_time_format = [];
  private filter_timezone = [];
  private gridStateLS: GridStateModel = {visibleArray: [], pinnedArray: [], resizedArray: []};
  private tabFilter;
  private subscribeTimer;
  private tabData: TabModel;
  private symbolName = '';
  private intervalUpdate;
  private lastStream: string;
  private gridDefaults: GridOptions = {
    ...defaultGridOptions,
    rowBuffer: 10,
    enableFilter: true,
    enableCellChangeFlash: true,
    enableSorting: true,

    suppressRowClickSelection: true,
    suppressFocusAfterRefresh: true,
    suppressScrollOnNewData: true,
    suppressMultiSort: true,
    rowSelection: 'single',
    gridAutoHeight: false,
    suppressNoRowsOverlay: true,
    animateRows: true,
    onCellDoubleClicked: (event: CellDoubleClickedEvent) => {
      this.messageInfoService.doubleClicked(event.data);
    },
    onCellClicked: (event: CellClickedEvent) => {
      this.messageInfoService.cellClicked(event);
    },
    onPinnedRowDataChanged: (event: PinnedRowDataChangedEvent) => {
      this.messageInfoService.onPinnedRowDataChanged();
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
    onColumnResized: (resizedEvent: ColumnResizedEvent) =>
      this.gridEventsService.columnIsResized(resizedEvent, this.tabName, this.gridStateLS),
    onColumnVisible: (visibleEvent: ColumnVisibleEvent) =>
      columnIsVisible(visibleEvent, this.tabName, this.gridStateLS),
    onColumnMoved: (movedEvent: ColumnMovedEvent) =>
      columnIsMoved(movedEvent, this.tabName, this.gridStateLS),
    onColumnPinned: (pinnedEvent: ColumnPinnedEvent) =>
      columnIsPinned(pinnedEvent, this.tabName, this.gridStateLS),
    getContextMenuItems: getContextMenuItems.bind(this),
  };

  private schemaMap: SchemaTypesMap;

  constructor(
    private appStore: Store<AppState>,
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private streamDetailsEffects: StreamDetailsEffects,
    private modalService: BsModalService,
    private websocketService: WebsocketService,
    private wsService: WSService,
    private monitorLogGridDataService: MonitorLogGridDataService,
    private gridEventsService: GridEventsService,
    private gridService: GridService,
    private gridContextMenuService: GridContextMenuService,
    private streamModelsService: StreamModelsService,
    private globalFiltersService: GlobalFiltersService,
    private streamsService: StreamsService,
    private messageInfoService: RightPaneService,
  ) {}

  ngOnInit() {
    this.gridOptions = {
      ...this.gridDefaults,
      rowData: [],
    };

    this.gridContextMenuService.addColumnMenuItems([
      {
        data: (event) => ({
          name: 'Autosize This Column',
          action: () => {
            event.columnApi.autoSizeColumn(event.column);
            const filtered = this.gridStateLS.resizedArray.filter(
              (item) => item.colId !== event.column.getColId(),
            );
            this.gridStateLS.resizedArray = [...filtered];
            localStorage.setItem('gridStateLS' + this.tabName, JSON.stringify(this.gridStateLS));
          },
        }),
        alias: 'autosize',
      },
      {
        data: (event) => ({
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
        data: (event) => ({
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

    this.globalFiltersService
      .getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters) => {
        this.filter_date_format = filters.dateFormat;
        this.filter_timezone = filters.timezone;
        this.filter_time_format = filters.timeFormat;
      });
  }

  cleanWebsocketSubscription() {
    this.monitorLogGridDataService?.destroy();
    if (this.readyApi && this.readyApi.api) {
      this.readyApi.api.setRowData([]);
    }
    clearInterval(this.intervalUpdate);
    this.wsUnsubscribe$.next(true);
    this.wsUnsubscribe$.complete();
    this.wsUnsubscribe$ = new Subject();
  }

  sendMessage(socketData: WSLiveModel) {
    if (this.readyApi && this.readyApi.api) {
      this.readyApi.api.setRowData([]);
    }

    this.websocketService.send(socketData);
  }

  ngOnDestroy(): void {
    this.cleanWebsocketSubscription();
    this.destroy$.next(true);
    this.destroy$.complete();
    this.streamsStore.dispatch(new StreamDetailsActions.StopSubscriptions());
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
      });

    this.streamDetailsEffects.setSchema
      .pipe(
        withLatestFrom(this.appStore.pipe(select(getActiveTabSettings))),
        takeUntil(this.destroy$),
      )
      .subscribe(([action, tabSettings]) => {
        if (!action.payload.schema) {
          return;
        }

        this.schemaMap = this.streamModelsService.getSchemaMap(action.payload.schemaAll);

        if (action.payload.schema && action.payload.schema.length) {
          this.schema = [...action.payload.schema];
        }
        const hideAllColumns = false;
        const props = [
          columnsVisibleColumn(),
          {
            headerName: 'Symbol',
            field: 'symbol',
            tooltipField: 'symbol',
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
            sort: 'desc',
            comparator: (valueA, valueB, nodeA, nodeB, isInverted) => {
              let VALUE = new Date(valueA).getTime() - new Date(valueB).getTime();
              if (isInverted) VALUE = -1 * VALUE;
              if (VALUE > 0) {
                return -1;
              } else if (VALUE === 0) {
                return 0;
              }
              return 1;
            },
            width: 160,
            headerTooltip: 'Timestamp',
            cellRenderer: (params) => this.gridService.dateFormat(params),
            tooltipValueGetter: (params) => this.gridService.dateFormat(params),
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
          ...this.gridService.columnFromSchema(
            this.streamModelsService.getSchemaForColumns(
              action.payload.schema,
              action.payload.schemaAll,
            ),
            hideAllColumns,
          ),
        ];
        readyEvent.api.setColumnDefs(null);
        readyEvent.api.setColumnDefs(props);
        this.gridStateLS = gridStateLSInit(readyEvent.columnApi, this.tabName, this.gridStateLS);
        this.messageInfoService.setGridApi(this.readyApi);

        if (
          this.tabFilter &&
          this.tabFilter.filter_types &&
          this.readyApi &&
          this.readyApi.columnApi &&
          this.readyApi.columnApi.getAllColumns() &&
          this.readyApi.columnApi.getAllColumns().length
        ) {
          const columns = [...this.readyApi.columnApi.getAllColumns()];
          const filter_types_arr = this.tabFilter.filter_types;
          const columnsVisible = [];
          for (let j = 0; j < filter_types_arr.length; j++) {
            for (let i = 0; i < columns.length; i++) {
              if (
                String(columns[i]['colId']).indexOf(
                  String(filter_types_arr[j]).replace(/\./g, '-'),
                ) !== -1
              ) {
                columnsVisible.push(columns[i]['colId']);
              } else if (
                columns[i]['colId'] !== '0' &&
                columns[i]['colId'] !== 'symbol' &&
                columns[i]['colId'] !== 'timestamp'
              ) {
                this.readyApi.columnApi.setColumnVisible(columns[i]['colId'], false);
              }
            }
          }
          for (const col of columnsVisible) {
            this.readyApi.columnApi.setColumnVisible(col, true);
          }
        }
      });

    this.appStore
      .pipe(
        select(getActiveTab),
        filter(Boolean),
        switchMap((tab: TabModel) => this.streamsService.getProps(tab.stream)),
        filter((props: any) => props && props.props),
        distinctUntilChanged(),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe((props) => {
        combineLatest([
          this.appStore.pipe(
            select(getActiveOrFirstTab),
            filter((tab: TabModel) => tab && tab.monitor),
            distinctUntilChanged((prevTabModel: TabModel, nextTabModel: TabModel) => {
              const PREV = new TabModel(prevTabModel);
              const NEXT = new TabModel(nextTabModel);
              delete PREV.tabSettings;
              delete NEXT.tabSettings;
              return Diff(PREV, NEXT);
            }),
            tap((tab) => {
              if (tab.stream && tab.stream !== this.lastStream) {
                this.lastStream = tab.stream;
                this.streamDetailsStore.dispatch(
                  new StreamDetailsActions.GetSchema({streamId: tab.stream}),
                );
              }
            }),
          ),
          this.appStore.pipe(
            select(streamsDetailsStateSelector),
            filter((state: DetailsState) => !!state.schema),
          ),
        ])
          .pipe(takeUntil(this.destroy$), distinctUntilChanged())
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

            this.subscribeTimer = setTimeout(() => {
              const socketData: WSLiveModel = {
                fromTimestamp: null,
              };

              if (tab.symbol) {
                socketData.symbols = [tab.symbol];
              }
              if (tab.space) {
                socketData.space = tab.space;
              }

              if (tab.filter.filter_symbols && tab.filter.filter_symbols.length) {
                socketData.symbols = tab.filter.filter_symbols;
              }
              if (tab.filter.filter_types && tab.filter.filter_types.length) {
                socketData.types = tab.filter.filter_types;
              }

              this.monitorLogGridDataService?.destroy();

              this.subIsInited = true;
              this.monitorLogGridDataService
                .getSubscription(
                  `/user/topic/monitor/${escape(tab.stream)}`,
                  socketData,
                  this.schemaMap,
                )
                .pipe(takeUntil(this.destroy$))
                .subscribe(({data, newDataLength}) => {
                  this.readyApi.api.setRowData(data);
                  if (newDataLength) {
                    this.flashRows(this.readyApi.api, newDataLength);
                  }
                });
            }, 500);
          });
      });
  }

  private flashRows(gridApi, rowsCount) {
    const ROWS = [];
    for (let i = 0; i < rowsCount; i++) {
      ROWS.push(gridApi.getDisplayedRowAtIndex(i));
    }
    gridApi.flashCells({rowNodes: ROWS});
  }
}
