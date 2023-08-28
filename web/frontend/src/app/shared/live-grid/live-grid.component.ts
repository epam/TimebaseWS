import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { HdDate } from '@assets/hd-date/hd-date';
import { select, Store }                                                             from '@ngrx/store';
import { StompHeaders }                                                       from '@stomp/stompjs';
import { AgGridModule }                                                       from 'ag-grid-angular';
import {
  CellClickedEvent,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridOptions,
  GridReadyEvent,
  ICellRendererParams,
}                                                                             from 'ag-grid-community';
import { BsModalRef, BsModalService }                                         from 'ngx-bootstrap/modal';
import { Observable, ReplaySubject, Subject, Subscription, of }            from 'rxjs';
import { filter, map, take, takeUntil, withLatestFrom, switchMap } from 'rxjs/operators';
import { TabModel } from 'src/app/pages/streams/models/tab.model';
import { getActiveTab } from 'src/app/pages/streams/store/streams-tabs/streams-tabs.selectors';
import { WebsocketService }                                                   from '../../core/services/websocket.service';
import { WSService }                                                          from '../../core/services/ws.service';
import { AppState }                                                           from '../../core/store';
import { getAppVisibility }                                                   from '../../core/store/app/app.selectors';
import { GridStateModel }                                                     from '../../pages/streams/models/grid.state.model';
import { StreamDetailsModel }                                                 from '../../pages/streams/models/stream.details.model';
import { WSLiveModel }                                                        from '../../pages/streams/models/ws-live.model';
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
import { SchemaService } from '../services/schema.service';
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

interface RowSortingOrder {
  symbol?: string,
  timestamp?: string,
  'original-timestamp'?: string,
}

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
  rowSortingOrder: RowSortingOrder = {
    symbol: 'none',
    timestamp: 'none',
    'original-timestamp': 'none',
  };
  implementedSorting: RowSortingOrder;

  private wsUnsubscribe$ = new Subject();
  private subIsInited: boolean;
  private destroy$ = new Subject();
  private gridStateLS: GridStateModel = {visibleArray: [], pinnedArray: [], resizedArray: [], autoSized: []};
  private gridReady$ = new ReplaySubject<GridReadyEvent>(1);
  private staticFields: { [key: string]: string | number | boolean };
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
      autosizeAllColumns(params.columnApi, true, this.gridStateLS.autoSized || []);
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
    getRowNodeId: (data) => `${data.symbol}-${data.$type}`,
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
    private streamPropsStore: Store<fromStreamProps.FeatureState>,
    private gridEventsService: GridEventsService,
    private gridService: GridService,
    private gridContextMenuService: GridContextMenuService,
    private streamModelsService: StreamModelsService,
    private globalFiltersService: GlobalFiltersService,
    private tabStorageService: TabStorageService<HasRightPanel>,
    private messageInfoService: RightPaneService,
    private schemaService: SchemaService
  ) {}

  ngOnInit() {
    this.gridOptions = {...this.gridDefaults};
    this.selectedMessage$ = this.appStore.pipe(select(getSelectedMessage));
    this.messageInfoService.clearSelectedMessage();
    this.gridContextMenuService.addColumnSizeMenuItems(() => this.gridStateLS, () => this.subIsInited, this.tabName);

    this.globalFiltersService
      .getFilters()
      .pipe(withLatestFrom(this.gridReady$), takeUntil(this.destroy$))
      .subscribe(([filters, readyEvent]) => readyEvent.api.redrawRows());

    this.gridEventsService.rowSortingOrder
      .pipe(takeUntil(this.destroy$))
      .subscribe(order => this.rowSortingOrder = order);
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

    this.appStore.pipe(
      select(getActiveTab),
      switchMap((tab: TabModel) => {
        return tab?.stream ? this.schemaService.getSchema(tab.stream) : of(this.schemaData);
      }),
      switchMap(schema => {
        schema.all.forEach(type => {
          type.fields.forEach(field => {
            if (field.static) {
              this.staticFields = { ...this.staticFields, [field.name]: field.value };
              }
            })
          }
        );

        return this.wsService.watch(url, stompHeaders)
      }),
      withLatestFrom(this.appStore.select(getAppVisibility)),
      filter(([ws_data, app_is_visible]: [any, boolean]) => app_is_visible),
      map(([ws_data]) => ws_data),
      takeUntil(this.wsUnsubscribe$)
    )
      .subscribe((data: any) => {
        const addRows = [],
          updateRows = [];
        const parseData: [] = JSON.parse(data.body);
        parseData.forEach((row: object) => {
          const rowWithStatic = { ...row, ...this.staticFields };
          if (readyEvent.api.getRowNode(`${rowWithStatic['symbol']}-${rowWithStatic['$type']}`)) {
            updateRows.push(new StreamDetailsModel(rowWithStatic, this.schemaMap));
          } else {
            addRows.push(new StreamDetailsModel(rowWithStatic, this.schemaMap));
          }
        });

    const rowData = [...addRows];
    readyEvent.api.forEachNode(node => rowData.push(node.data));

    if (JSON.stringify(this.rowSortingOrder) !== JSON.stringify(this.implementedSorting) || (this.implementedSorting && addRows.length)) {
      if (this.rowSortingOrder.symbol && this.rowSortingOrder.symbol !== 'none') {
        if (this.rowSortingOrder.symbol === 'ascending') {
          rowData.sort((row1, row2) => {
            if (row1.symbol !== row2.symbol) {
              return row1.symbol > row2.symbol ? 1 : -1;
            } else {
              return row1.$type > row2.$type ? 1 : -1;
            }
          });
        } else {
          rowData.sort((row1, row2) => {
            if (row1.symbol !== row2.symbol) {
              return row1.symbol < row2.symbol ? 1 : -1
            } else {
              return row1.$type > row2.$type ? 1 : -1;
            };
          })
        }
      }

      if (this.rowSortingOrder.timestamp && this.rowSortingOrder.timestamp !== 'none') {
        rowData.sort((row1, row2) => {
          const date1 = new HdDate(row1.nanoTime ?? row1.timestamp);
          const date2 = new HdDate(row2.nanoTime ?? row2.timestamp);
          return this.compareHdDates(date1, date2, 'timestamp');
        })
      }

      if (this.rowSortingOrder['original-timestamp'] && this.rowSortingOrder['original-timestamp'] !== 'none') {
        rowData.sort((row1, row2) => {
          const date1 = new HdDate(row1.original.timestamp);
          const date2 = new HdDate(row2.original.timestamp);
          return this.compareHdDates(date1, date2, 'original-timestamp');
        })
      }
      this.implementedSorting = this.rowSortingOrder;
      readyEvent.api.setRowData(rowData);
    } else {
      readyEvent.api.updateRowData( { add: addRows });
    }

    readyEvent.api.updateRowData( { update: updateRows } );
    })
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
          width: 180,
          headerTooltip: 'Timestamp',
          cellRenderer: (params: ICellRendererParams) => this.gridService.dateFormat(params, params.data?.nanoTime, true),
          tooltipValueGetter: (params: ICellRendererParams) => this.gridService.dateFormat(params, params.data?.nanoTime, true),
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

  private compareHdDates(date1: HdDate, date2: HdDate, sortingColumn: string) {
    const dateAsNumber1 = BigInt(date1.getTime() * 1e6 + date1.getNanosFraction());
    const dateASNumber2 = BigInt(date2.getTime() * 1e6 + date2.getNanosFraction());
    if (this.rowSortingOrder[sortingColumn] === 'ascending') {
      return dateAsNumber1 > dateASNumber2 ? 1 : -1;
    } else {
      return dateASNumber2 > dateAsNumber1 ? 1 : -1;
    }
  }
}
