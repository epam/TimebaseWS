import { HttpErrorResponse }                                                                from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild }                 from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HdDate }                                                                           from '@assets/hd-date/hd-date';
import { select, Store }                                                                    from '@ngrx/store';
import { AgGridModule }                                                                     from 'ag-grid-angular';
import {
  CellClickedEvent,
  CellDoubleClickedEvent,
  ColDef,
  Column,
  ColumnApi,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridOptions,
  GridReadyEvent,
  ICellRendererParams,
  NavigateToNextCellParams,
  RowNode,
}                                                                                           from 'ag-grid-community';
import { CellContextMenuEvent, CellKeyDownEvent, ModelUpdatedEvent, RowSelectedEvent } from 'ag-grid-community/dist/lib/events';
import { BsModalRef, BsModalService }                                                       from 'ngx-bootstrap/modal';
import { BehaviorSubject, combineLatest, Observable, of, ReplaySubject, timer } from 'rxjs';
import {
  catchError,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  tap,
}                                 from 'rxjs/operators';
import { StreamsService } from 'src/app/shared/services/streams.service';
import { AppState }               from '../../../../core/store';
import { GridTotalService }       from '../../../../shared/components/grid-total/grid-total.service';
import { GridContextMenuService } from '../../../../shared/grid-components/grid-context-menu.service';
import {
  SchemaAllTypeModel,
  SchemaTypeModel,
}                                 from '../../../../shared/models/schema.type.model';
import { HasRightPanel }          from '../../../../shared/right-pane/has-right-panel';
import { RightPaneService }       from '../../../../shared/right-pane/right-pane.service';
import { GlobalFiltersService }   from '../../../../shared/services/global-filters.service';
import { GridEventsService }      from '../../../../shared/services/grid-events.service';
import { GridService }            from '../../../../shared/services/grid.service';
import { PermissionsService }                                                               from '../../../../shared/services/permissions.service';
import { SchemaService }                                                                    from '../../../../shared/services/schema.service';
import { StreamModelsService }                                                              from '../../../../shared/services/stream-models.service';
import { TabStorageService }                                                                from '../../../../shared/services/tab-storage.service';
import {
  autosizeAllColumns,
  columnsVisibleColumn,
  defaultGridOptions,
  gridStateLSInit,
}                                                                                           from '../../../../shared/utils/grid/config.defaults';
import { ChartTypes }                                                                       from '../../models/chart.model';
import { FilterModel } from '../../models/filter.model';
import { GridStateModel }                                                                   from '../../models/grid.state.model';
import { StreamDetailsModel }                                                               from '../../models/stream.details.model';
import { TabModel }                                                                         from '../../models/tab.model';
import { StreamDataService }                                                                from '../../services/stream-data.service';
import * as StreamDetailsActions
                                                                                            from '../../store/stream-details/stream-details.actions';
import * as fromStreamDetails
                                                                                            from '../../store/stream-details/stream-details.reducer';
import * as fromStreams
                                                                                            from '../../store/streams-list/streams.reducer';

import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
}                                    from '../../store/streams-tabs/streams-tabs.selectors';
import { UpdateTab } from '../../store/streams-tabs/streams-tabs.actions';
import { GridStateService } from '../../services/grid-state.service';
import { SymbolsService } from 'src/app/shared/services/symbols.service';
import { StorageService } from 'src/app/shared/services/storage.service';
import { editedMessageProps, ModalSendMessageComponent } from '../modals/modal-send-message/modal-send-message.component';

const now = new HdDate();

export const toUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() + new Date().getTimezoneOffset() * 60 * 1000);
  return newDate;
};

export const fromUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() - new Date().getTimezoneOffset() * 60 * 1000);
  return newDate;
};

@Component({
  selector: 'app-stream-view-reverse',
  templateUrl: './stream-view-reverse.component.html',
  styleUrls: ['./stream-view-reverse.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GridService, GridContextMenuService, StreamDataService, GridTotalService],
})
export class StreamViewReverseComponent implements OnInit, OnDestroy {
  @ViewChild('streamDetailsGrid', {static: true}) agGrid: AgGridModule;
  
  bsModalRef: BsModalRef;
  streamName: string;
  tabName: string;
  streamDetails: Observable<fromStreamDetails.State>;
  activeTab: Observable<TabModel>;
  gridOptions: GridOptions;
  hideGrid$ = new BehaviorSubject(true);
  error$ = new BehaviorSubject<HttpErrorResponse>(null);

  private schema = {};
  private periodicity: number;
  private editingMessageNanoTime: string;
  private reverseStreamOrder: boolean;
  private messageInfo: editedMessageProps;
  private streamFilters = {symbols: [], types: []};
  private tabSymbolFilter: string[];
  private columnsIdVisible: { [index: string]: boolean } = {};
  private gridStateLS: GridStateModel = {visibleArray: [], pinnedArray: [], resizedArray: [], autoSized: []};
  private destroy$ = new ReplaySubject(1);
  private readyApi: GridOptions;
  private rowData;
  private selectedRowIndex: number;
  private messageEdited = false;
  private streamId: string;
  private visibleDefaultColumns: string[];
  private gridDefaults: GridOptions = {
    ...defaultGridOptions,
    rowBuffer: 10,
    enableFilter: true,
    enableSorting: true,
    suppressRowClickSelection: false,
    rowSelection: 'single',
    defaultColDef: {
      filter: false,
      sortable: false,
      lockPinned: true,
      headerComponent: 'GridHeaderComponent',
    },
    enableRangeSelection: true,
    rowModelType: 'infinite',
    infiniteInitialRowCount: 1,
    maxConcurrentDatasourceRequests: 1,
    enableServerSideSorting: true,
    enableServerSideFilter: true,
    gridAutoHeight: false,
    stopEditingWhenGridLosesFocus: true,
    suppressCellSelection: true,
    onCellDoubleClicked: (event: CellDoubleClickedEvent) => {
      this.selectedRowIndex = event.rowIndex;
      this.messageInfoService.doubleClicked(event.data);
    },
    onCellClicked: (event: CellClickedEvent) => {
      this.selectedRowIndex = event.rowIndex;
      this.messageInfoService.cellClicked(event);
    },
    onPinnedRowDataChanged: () => {
      this.messageInfoService.onPinnedRowDataChanged();
    },
    onGridReady: (readyEvent: GridReadyEvent) => this.gridIsReady(readyEvent),
    onColumnResized: (resizedEvent: ColumnResizedEvent) => this.gridEventsService
      .columnIsResized(resizedEvent, this.tabName, this.gridStateLS),
    onColumnVisible: (visibleEvent: ColumnVisibleEvent) => this.gridStateService
      .updateColumnState(this.streamId, visibleEvent.columnApi.getColumnState()),
    onColumnMoved: (movedEvent: ColumnMovedEvent) => this.gridStateService
      .updateColumnState(this.streamId, movedEvent.columnApi.getColumnState()),
    onColumnPinned: (pinnedEvent: ColumnPinnedEvent) => this.gridStateService
      .updateColumnState(this.streamId, pinnedEvent.columnApi.getColumnState()),
    onModelUpdated: (event: ModelUpdatedEvent) => {
      this.gridService.onCellFormatting().pipe(take(1)).subscribe(() => {
        autosizeAllColumns(event.columnApi, true, this.gridStateLS.autoSized || []);
        if (this.gridStateLS.resizedArray.length) {
          for (const item of this.gridStateLS.resizedArray) {
            event.columnApi.setColumnWidth(item.colId, item.actualWidth, true);
          }
        }
      });
    },
    navigateToNextCell: (params: NavigateToNextCellParams) => this.gridService.upDownKeysNavigation(this.gridOptions.api, params),
    onCellKeyDown: (event: CellKeyDownEvent) => this.onKeyDown(event),
    onCellContextMenu: (event: CellContextMenuEvent) => this.onContextMenu(event),
    onRowSelected: (event: RowSelectedEvent) => {
      if (!this.selectedRowIndex) {
        this.selectedRowIndex = event.rowIndex;
      }
    },
  };
  
  constructor(
    private appStore: Store<AppState>,
    private route: ActivatedRoute,
    private streamsStore: Store<fromStreams.FeatureState>,
    private dataSource: StreamDataService,
    private modalService: BsModalService,
    private gridEventsService: GridEventsService,
    private globalFiltersService: GlobalFiltersService,
    private gridService: GridService,
    private gridContextMenuService: GridContextMenuService,
    private permissionsService: PermissionsService,
    private streamModelsService: StreamModelsService,
    private messageInfoService: RightPaneService,
    private schemaService: SchemaService,
    private streamDataService: StreamDataService,
    private streamsService: StreamsService,
    private symbolsService: SymbolsService,
    private gridStateService: GridStateService,
    private storageService: StorageService,
  ) {}
  
  ngOnInit() {
    combineLatest([
      this.permissionsService.isWriter().pipe(take(1)),
      this.appStore.pipe(select(getActiveTab), filter(Boolean)),
    ]).subscribe(([isWriter, tab]: [boolean, TabModel]) => {
      this.reverseStreamOrder = !!tab.reverse;
      if (tab.symbol) {
        this.tabSymbolFilter = [tab.symbol];
      }
      
      this.streamId = tab.stream;
      this.streamName = tab.name;
      this.tabName = tab.stream + tab.id;
      
      const sendMessageMenu = {
        data: (event) => ({
          disabled: !event.node || !this.streamId,
          name: 'Send Message',
          action: () => {
            this.bsModalRef = this.modalService.show(ModalSendMessageComponent, {
              initialState: {
                stream: {
                  id: this.streamId,
                  name: this.streamName,
                },
                formData: {
                  ...(event.node.data as StreamDetailsModel)?.original,
                  timestamp: event.node.data.nanoTime ?? event.node.data.timestamp,
                  instrumentType: event.node.data.instrumentType
                },
                editMessageMode: false,
              },
              ignoreBackdropClick: true,
              class: 'modal-message scroll-content-modal',
            });
          },
        }),
        alias: 'sendMessage',
      };

      const editMessageMenu = {
        data: (event) => ({    
          disabled: !event.node || !this.streamId,
          name: 'Edit Message',
          action: () => {
            this.bsModalRef = this.modalService.show(ModalSendMessageComponent, {
              initialState: {
                stream: {
                  id: this.streamId,
                  name: this.streamName,
                },
                formData: {
                  ...(event.node.data as StreamDetailsModel)?.original,
                  timestamp: event.node.data.nanoTime ?? event.node.data.timestamp,
                  instrumentType: event.node.data.instrumentType
                },
                editMessageMode: true,
                messageInfo: this.messageInfo,
                editingMessageNanoTime: this.editingMessageNanoTime,
              },
              ignoreBackdropClick: true,
              class: 'modal-message scroll-content-modal',
            });
          },
        }),
        alias: 'editMessage',
      }
      
      const orderBookMenu = {
        data: (event: { node: RowNode }) => ({
          disabled: true,
          name: 'View Oder Book',
          action: () => this.messageInfoService.viewOrderBook(event.node.data, event.node.rowIndex),
        }),
        alias: 'openOrderBook',
      };
      
      const items = [];
     
      if (isWriter && !tab.isView) {
        typeof tab.space === 'string' ? 
          items.push(sendMessageMenu) : items.push(sendMessageMenu, editMessageMenu);
      }
      
      if (tab.chartType?.includes(ChartTypes.PRICE_LEVELS)) {
        items.push(orderBookMenu);
      }

      this.gridContextMenuService.addCellMenuItems(items);
      this.gridContextMenuService.addColumnSizeMenuItems(
        () => this.gridStateLS,
        () => this.rowData,
        this.tabName,
      ).pipe(takeUntil(this.destroy$)).subscribe(event => {
        this.columnsIdVisible = {};
        this.columnsVisibleData(event.columnApi, this.rowData);
        this.applySavedColumnState(event.columnApi);
        setTimeout(() => event.columnApi.autoSizeAllColumns());
      });
    });
    
    this.modalService.onHide
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.initialState?.editMessageMode) {
          this.messageEdited = true;
          setTimeout(() => this.messageEdited = false, 2000);
        }
        this.streamDataService.getRows(this.streamDataService.getRowsParams);
      });

    this.activeTab = this.appStore.pipe(select(getActiveOrFirstTab));
    
    this.globalFiltersService
      .getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => setTimeout(() => this.readyApi?.api.redrawRows(), 0));
    
    this.gridOptions = this.gridDefaults;

    this.route.url
      .pipe(
        filter(url => !!url.find(segment => segment.path === 'reverse')),
        switchMap(() => this.activeTab.pipe(filter(tab => !!tab.stream), take(1))),
        switchMap(tab => (tab.symbol
          ? this.symbolsService.getProps(tab.stream, tab.symbol, null, false)
          : this.streamsService.getProps(tab.stream, false)).pipe(map(result => ({ props: result.props, currentTab: tab})))
        ),
        takeUntil(this.destroy$),
      ).subscribe(( { props, currentTab } ) => {
        const newFromValue = props.symbolRange ? props.symbolRange.end : props.range.end;
        if (newFromValue) {
          const tabPosition = this.storageService.getTabs().findIndex(tab => tab.id === currentTab.id);
          const newTab = new TabModel({...currentTab, 
            filter: { ...currentTab.filter,
              from: props.symbolRange ? props.symbolRange.end : props.range.end
            } });
          this.appStore.dispatch(new UpdateTab([{tab: newTab, position: tabPosition}]));
        }
      });
      
    this.dataSource.onLoadedData()
      .pipe(takeUntil(this.destroy$), filter(() => this.messageEdited), delay(1000))
      .subscribe(() => {
        this.setSelectedRow();
        this.selectedRowIndex = null;
      });
  }

  private setSelectedRow() {
    let targetRow: RowNode;
    if (typeof this.selectedRowIndex === 'number') {
      targetRow = this.readyApi.api.getDisplayedRowAtIndex(this.selectedRowIndex);
    } else {
      this.readyApi.api.setPinnedTopRowData([]);
    }
    if (targetRow) {
      this.messageInfoService.cellClicked(targetRow.data);
      this.messageInfoService.doubleClicked(targetRow.data);
      targetRow.setSelected(true);
    }
  }
  
  columnsVisibleData(columnApi: ColumnApi, data: any) {
    if (!this.gridStateService.getColumnState(this.streamId)) {
      const cols: Column[] = columnApi.getAllColumns();
      // TODO: sometimes if > 1000 columns don't work getAllColumns() - is NULL , need another method
      if (cols && cols.length) {
        for (let i = 0; i < cols.length; i++) {
          const colIdArr = cols[i]['colId'].split('.');
          
          if (colIdArr.length === 2) {
            if (this.columnsIdVisible[cols[i]['colId']]) {
              return;
            }
            if (
              data.find((item) => {
                if (item.hasOwnProperty(colIdArr[0])) {
                  const cellValue = item[colIdArr[0]][colIdArr[1]];
                  return cellValue === false ? '' + cellValue : cellValue;
                }
              })
            ) {
              columnApi.setColumnVisible(cols[i]['colId'], true);
              this.columnsIdVisible[cols[i]['colId']] = true;
            }
          }
        }
        this.visibleDefaultColumns.forEach(id => columnApi.setColumnVisible(id, true));
      }
    }
    
    this.gridStateLS = gridStateLSInit(columnApi, this.tabName, this.gridStateLS);

    this.appStore
      .pipe(
        select(getActiveTabFilters),
        filter((filter) => !!filter),
        takeUntil(this.destroy$),
      )
      .subscribe((filter: FilterModel) => {
        this.streamFilters = {
          symbols: filter.filter_symbols ?? this.tabSymbolFilter,
          types: filter.filter_types,
        }
      });
  }

  private applySavedColumnState(columnApi: ColumnApi) {
    const savedColumnState = this.gridStateService.getColumnState(this.streamId);
    if (savedColumnState) {
      columnApi.setColumnState(savedColumnState);
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.streamsStore.dispatch(new StreamDetailsActions.StopSubscriptions());
  }

  onContextMenu(event: CellContextMenuEvent) {
    let sameTimeStampId = 0;
    let counter = 0;
    event.api.forEachNode(node => {
      if (counter === event.rowIndex) {
        return;
      }
      if (node.data.timestamp === event.data.timestamp) {
        sameTimeStampId += 1;
      }
      counter += 1;
    })

    this.messageInfo = {
      symbols: this.streamFilters.symbols,
      types: this.streamFilters.types,
      timestamp: event.data.timestamp,
      offset: sameTimeStampId,
      reverse: this.reverseStreamOrder,
    };
    this.editingMessageNanoTime = event.data.nanoTime;
  }
  
  private gridIsReady(readyEvent: GridReadyEvent) {
    this.readyApi = {...readyEvent};
    
    this.gridService.setTooltipDelay(readyEvent);
    
    const tabToUnique = (tab) =>
      JSON.stringify({id: tab.id, filter: {...tab.filter, silent: null, manuallyChanged: null}});
    
    const getProps = (schema) => {
      const defaultColumns = [
        {
          headerName: 'Symbol',
          field: 'symbol',
          tooltipField: 'symbol',
          pinned: 'left',
          filter: false,
          sortable: false,
          headerTooltip: 'Symbol',
        },
        {
          headerName: 'Timestamp',
          field: 'timestamp',
          pinned: 'left',
          filter: false,
          sortable: false,
          headerTooltip: 'Timestamp',
          width: 180,
          cellRenderer: (params: ICellRendererParams) => this.gridService.dateFormat(params),
          tooltipValueGetter: (params: ICellRendererParams) => this.gridService.dateFormat(params),
        },
        {
          headerName: 'Time',
          field: 'time',
          pinned: 'left',
          filter: false,
          sortable: false,
          headerTooltip: 'Time',
          hide: !this.periodicity,
          cellRenderer: (params: ICellRendererParams) => this.gridService.dateFormat(params, this.periodicity),
          tooltipValueGetter: (params: ICellRendererParams) => this.gridService.dateFormat(params, this.periodicity),
        },
        {
          headerName: 'Type',
          field: '$type',
          tooltipField: '$type',
          pinned: 'left',
          filter: false,
          sortable: false,
          headerTooltip: 'Type',
          hide: true,
        },
        {
          headerName: 'Instrument Type',
          field: 'instrumentType',
          tooltipField: 'instrumentType',
          pinned: 'left',
          filter: false,
          sortable: false,
          headerTooltip: 'Instrument Type',
          hide: true,
        },
      ];

      this.visibleDefaultColumns = defaultColumns.filter(col => !col.hide).map(col => col.field);

      return [
        columnsVisibleColumn(),
        ...defaultColumns,
        ...this.gridService.columnFromSchema(
          this.streamModelsService.getSchemaForColumns(schema.types, schema.all),
          true,
        ),
      ];
    };
    
    this.appStore
      .pipe(
        select(getActiveTab),
        filter(Boolean),
        distinctUntilChanged((prev, current) => tabToUnique(prev) === tabToUnique(current)),
        filter(tab => !!tab['filter'].from),
      )
      .pipe(
        debounceTime(0),
        switchMap((activeTab: TabModel) => {
          this.hideGrid$.next(true);
          this.error$.next(null);
          return this.schemaService.getSchema(activeTab.stream, null, true).pipe(
            map((schema) => [activeTab, schema]),
            take(1),
            catchError(e => {
              this.error$.next(e);
              return of(null);
            }),
            filter(Boolean),
          );
        }),
        tap(
          ([activeTab, schema]: [
            TabModel,
            { types: SchemaTypeModel[]; all: SchemaAllTypeModel[] },
          ]) => {
            this.schema = schema;
            this.messageInfoService.tabChanged();
            this.columnsIdVisible = {};
            readyEvent.api.setDatasource(this.dataSource.withTab(activeTab, schema.all));
          },
        ),
        switchMap(([activeTab, schema]) => this.streamsService.getProps(activeTab.stream)),
        tap(streamInfo => {
          if (streamInfo.props.periodicity.type === 'REGULAR') {
            this.periodicity = streamInfo.props.periodicity.milliseconds;
          }
        }),
        switchMap(() =>
          this.dataSource.onLoadedData().pipe(
            take(1),
            map((data) => [getProps(this.schema), data]),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(([props, data]) => {
        const instrumentTypeIsVisible = !!(data[0] as StreamDetailsModel)?.instrumentType;
        this.rowData = data;
        const allProps = props as ColDef[];

        readyEvent.api.setColumnDefs(null);
        readyEvent.api.setColumnDefs(instrumentTypeIsVisible ? allProps : allProps.filter(prop => prop.field !== 'instrumentType'));
        this.columnsIdVisible = {};
        this.columnsVisibleData(readyEvent.columnApi, this.rowData);
        this.applySavedColumnState(readyEvent.columnApi);
        setTimeout(() => readyEvent.columnApi.autoSizeAllColumns());
        timer().subscribe(() => this.hideGrid$.next(false));
      });
    
    this.columnsIdVisible = {};
    this.messageInfoService.setGridApi(this.readyApi);
  }

  private onKeyDown(e) {
    if (e.event.code === 'Enter') {
      this.messageInfoService.doubleClicked(e.data, e.rowIndex);
    }
    else if (e.event.code === 'Tab') {
      this.gridService.tabKeyNavigation(e);
    }
  }
}
