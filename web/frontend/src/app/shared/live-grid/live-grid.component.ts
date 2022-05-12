import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { select, Store }                                                             from '@ngrx/store';
import { StompHeaders }                                                              from '@stomp/stompjs';
import { AgGridModule }                                                              from 'ag-grid-angular';
import {
  CellClickedEvent,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridOptions,
  GridReadyEvent,
}                                                                                    from 'ag-grid-community';
import { BsModalRef, BsModalService }                                                from 'ngx-bootstrap/modal';
import { Observable, ReplaySubject, Subject, Subscription, timer }                   from 'rxjs';
import { distinctUntilChanged, filter, map, take, takeUntil, withLatestFrom }        from 'rxjs/operators';
import { WebsocketService }                                                          from '../../core/services/websocket.service';
import { WSService }                                                                 from '../../core/services/ws.service';
import { AppState }                                                                  from '../../core/store';
import { getAppVisibility }                                                          from '../../core/store/app/app.selectors';
import { GridStateModel }                                                            from '../../pages/streams/models/grid.state.model';
import { StreamDetailsModel }                                                        from '../../pages/streams/models/stream.details.model';
import { WSLiveModel }                                                               from '../../pages/streams/models/ws-live.model';
import { CleanSelectedMessage }                                                      from '../../pages/streams/store/seletcted-message/selected-message.actions';
import { getSelectedMessage }                                                        from '../../pages/streams/store/seletcted-message/selected-message.selectors';
import * as StreamDetailsActions
                                                                                     from '../../pages/streams/store/stream-details/stream-details.actions';
import { StreamDetailsEffects }                                                      from '../../pages/streams/store/stream-details/stream-details.effects';
import * as fromStreamDetails
                                                                                     from '../../pages/streams/store/stream-details/stream-details.reducer';
import * as fromStreamProps
                                                                                     from '../../pages/streams/store/stream-props/stream-props.reducer';
import * as fromStreams
                                                                                     from '../../pages/streams/store/streams-list/streams.reducer';
import { GridContextMenuService }                                                    from '../grid-components/grid-context-menu.service';
import { LiveGridFilters }                                                           from '../models/live-grid-filters';
import { SchemaTypeModel, SchemaTypesMap }                                           from '../models/schema.type.model';
import { HasRightPanel }                                                             from '../right-pane/has-right-panel';
import { RightPaneService }                                                          from '../right-pane/right-pane.service';
import { GlobalFiltersService }                                                      from '../services/global-filters.service';
import { GridEventsService }                                                         from '../services/grid-events.service';
import { GridService }                                                               from '../services/grid.service';
import { StreamModelsService }                                                       from '../services/stream-models.service';
import { TabStorageService }                                                         from '../services/tab-storage.service';
import {
  autosizeAllColumns,
  columnIsMoved,
  columnIsPinned,
  columnIsVisible,
  columnsVisibleColumn,
  defaultGridOptions,
  getContextMenuItems,
  gridStateLSInit,
}                                                                                    from '../utils/grid/config.defaults';

@Component({
  selector: 'app-live-grid',
  templateUrl: './live-grid.component.html',
  styleUrls: ['./live-grid.component.scss'],
  providers: [GridService, GridContextMenuService],
})
export class LiveGridComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('streamDetailsGridLive', {static: true}) agGrid: AgGridModule;
  @Input() filters: LiveGridFilters;
  @Input() schemaData: {all: SchemaTypeModel[]; types: SchemaTypeModel[]};
  @Input() tabName: string;

  websocketSub: Subscription;
  schema = [];
  bsModalRef: BsModalRef;
  gridOptions: GridOptions;
  selectedMessage$: Observable<StreamDetailsModel>;

  private wsUnsubscribe$ = new Subject();
  private subIsInited: boolean;
  private destroy$ = new Subject();
  private gridStateLS: GridStateModel = {visibleArray: [], pinnedArray: [], resizedArray: []};
  private gridReady$ = new ReplaySubject<GridReadyEvent>(1);
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
      this.messageInfoService.doubleClicked(event.data);
    },
    onCellClicked: (event: CellClickedEvent) => {
      this.messageInfoService.cellClicked(event);
    },
    onPinnedRowDataChanged: () => {
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
    getRowNodeId: (data) => data.symbol,
  };

  private schemaMap: SchemaTypesMap;
  private filtersChange$ = new ReplaySubject<LiveGridFilters>(1);

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
    private streamModelsService: StreamModelsService,
    private globalFiltersService: GlobalFiltersService,
    private tabStorageService: TabStorageService<HasRightPanel>,
    private messageInfoService: RightPaneService,
  ) {}

  ngOnInit() {
    this.gridOptions = {...this.gridDefaults};
    this.selectedMessage$ = this.appStore.pipe(select(getSelectedMessage));
    this.messageInfoService.clearSelectedMessage();
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

    this.filtersChange$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
      )
      .subscribe((filters) => this.runLive(filters));

    this.globalFiltersService
      .getFilters()
      .pipe(withLatestFrom(this.gridReady$), takeUntil(this.destroy$))
      .subscribe(([filters, readyEvent]) => readyEvent.api.redrawRows());
  }

  createWebsocketSubscription(url: string, dataObj: WSLiveModel, readyEvent: GridReadyEvent) {
    this.subIsInited = true;
    const stompHeaders: StompHeaders = {};
    Object.keys(dataObj).forEach((key) => {
      if (typeof dataObj[key] !== 'object') {
        stompHeaders[key] = dataObj[key] + '';
      } else if (dataObj[key] && typeof dataObj[key] === 'object') {
        stompHeaders[key] = JSON.stringify(dataObj[key]);
      }
    });
    this.wsService
      .watch(url, stompHeaders)
      .pipe(
        withLatestFrom(this.appStore.select(getAppVisibility)),
        filter(([ws_data, app_is_visible]: [any, boolean]) => app_is_visible),
        map(([ws_data]) => ws_data),
        takeUntil(this.wsUnsubscribe$),
      )
      .subscribe((data: any) => {
        const addRows = [],
          updateRows = [];
        const parseData: [] = JSON.parse(data.body);
        parseData.forEach((row) => {
          if (readyEvent.api.getRowNode(row['symbol'])) {
            updateRows.push(new StreamDetailsModel(row, this.schemaMap));
          } else {
            addRows.push(new StreamDetailsModel(row, this.schemaMap));
          }
        });
        readyEvent.api.updateRowData({
          add: addRows,
          update: updateRows,
        });
      });
  }

  cleanWebsocketSubscription() {
    this.wsUnsubscribe$.next(true);
    this.wsUnsubscribe$.complete();
    this.wsUnsubscribe$ = new Subject();
  }

  sendMessage(socketData: WSLiveModel) {
    this.gridReady$.pipe(take(1)).subscribe((readyEvent) => {
      readyEvent.api.setRowData([]);
      this.websocketService.send(socketData);
    });
  }

  ngOnDestroy(): void {
    this.cleanWebsocketSubscription();
    this.destroy$.next(true);
    this.destroy$.complete();
    this.streamsStore.dispatch(new StreamDetailsActions.StopSubscriptions());
    this.appStore.dispatch(CleanSelectedMessage());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.schemaData?.currentValue) {
      this.setSchema(changes.schemaData.currentValue.types, changes.schemaData.currentValue.all);
    }

    if (changes.filters?.currentValue) {
      this.runLive(changes.filters?.currentValue);
    }
  }

  private gridIsReady(readyEvent: GridReadyEvent) {
    this.gridService.setTooltipDelay(readyEvent);
    this.gridReady$.next(readyEvent);
    this.messageInfoService.setGridApi(readyEvent);
  }

  private runLive({symbols, types, space, fromTimestamp, destination, qql}: LiveGridFilters) {
    this.gridReady$.pipe(take(1)).subscribe((readyEvent) => {
      readyEvent.api.setRowData([]);
      this.cleanWebsocketSubscription();
      const socketData: WSLiveModel = {
        fromTimestamp: null,
      };

      socketData.symbols = symbols;
      socketData.types = types;
      socketData.space = space;
      socketData.fromTimestamp = fromTimestamp;
      socketData.qql = qql;
      Object.keys(socketData)
        .filter((key) => [undefined, null].includes(socketData[key]))
        .forEach((key) => delete socketData[key]);

      this.createWebsocketSubscription(destination, socketData, readyEvent);
    });
  }

  private setSchema(types: SchemaTypeModel[], all: SchemaTypeModel[]) {
    this.gridReady$.pipe(take(1)).subscribe((readyEvent) => {
      if (!types) {
        return;
      }

      this.schemaMap = this.streamModelsService.getSchemaMap(all);

      if (types.length) {
        this.schema = [...types];
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
          this.streamModelsService.getSchemaForColumns(types, all),
          hideAllColumns,
        ),
      ];

      readyEvent.api.setColumnDefs(null);
      readyEvent.api.setColumnDefs(props);
      this.messageInfoService.setGridApi(readyEvent);
      this.gridStateLS = gridStateLSInit(readyEvent.columnApi, this.tabName, this.gridStateLS);
      this.updateColumnVisibilities();
    });
  }

  private updateColumnVisibilities() {
    this.gridReady$.pipe(take(1)).subscribe((gridReady) => {
      gridReady.api.setPinnedTopRowData([]);
      if (this.filters?.types?.length && gridReady.columnApi.getAllColumns()?.length) {
        const columns = [...gridReady.columnApi.getAllColumns()];
        const filter_types_arr = this.filters?.types;
        const columnsVisible = [];
        const toHide = [];
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
              toHide.push(columns[i]['colId']);
            }
          }
        }

        gridReady.columnApi.setColumnsVisible(toHide, false);
        gridReady.columnApi.setColumnsVisible(columnsVisible, true);
      }
    });
  }
}
