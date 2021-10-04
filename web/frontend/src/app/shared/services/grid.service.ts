import { Injectable, OnDestroy, Optional } from '@angular/core';
import {
  CellDoubleClickedEvent,
  Column,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridOptions,
  GridReadyEvent,
  RowClickedEvent,
  SelectionChangedEvent,
}                                          from 'ag-grid-community';
import { GridContextMenuService } from '../grid-components/grid-context-menu.service';
import { Currency }               from '../models/currency';
import {
  autosizeAllColumns,
  columnIsMoved,
  columnIsPinned,
  columnIsVisible,
  columnsVisibleColumn,
  defaultGridOptions,
  getContextMenuItems,
  gridStateLSInit,
  setMaxColumnWidth,
}                                 from '../utils/grid/config.defaults';
import { Observable, ReplaySubject, Subject }                 from 'rxjs';
import { GridStateModel }                                     from '../../pages/streams/models/grid.state.model';
import { GridEventsService }                                  from './grid-events.service';
import { StorageService }                                     from './storage.service';
import { delay, map, mapTo, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { DEFAULT_$TYPE_NAME }                                 from '../../pages/streams/models/stream.details.model';
import { formatHDate }                                        from '../locale.timezone';
import { SchemaTypeModel }                                    from '../models/schema.type.model';
import { GlobalFiltersService }                               from './global-filters.service';
import { GlobalFilters }                                      from '../models/global-filters';

@Injectable()
export class GridService implements OnDestroy {
  columnsHiddenByDefault = true;
  onResetColumns$ = new Subject<void>();
  
  private onDoubleClicked$ = new Subject<CellDoubleClickedEvent>();
  private onRowClicked$ = new Subject<RowClickedEvent>();
  private onSelectionChanged$ = new Subject<SelectionChangedEvent>();
  private onGridReady$ = new ReplaySubject<GridReadyEvent>(1);
  private tabName: string;
  private gridStateLS: GridStateModel = {visibleArray: [], resizedArray: [], pinnedArray: []};
  private rowData: object[];
  private destroy$ = new ReplaySubject(1);
  private globalFilters: GlobalFilters;
  private currencies: Currency[];
  private maxToolTipLength = 100;
  
  constructor(
    private gridEventsService: GridEventsService,
    private storageService: StorageService,
    private globalFiltersService: GlobalFiltersService,
    @Optional() private gridContextMenuService: GridContextMenuService,
  ) {
    this.currencies = JSON.parse(localStorage.getItem('currencies'));
    this.globalFiltersService.getFilters().pipe(
      takeUntil(this.destroy$),
    ).subscribe(globalFilters => {
      this.globalFilters = globalFilters;
    });
  }
  
  options(tabName: string, overrides: GridOptions = {}): GridOptions {
    this.tabName = tabName;
    
    if (this.gridContextMenuService) {
      this.gridContextMenuService.addColumnMenuItems([
        {
          data: event => ({
            name: 'Autosize This Column',
            action: () => {
              event.columnApi.autoSizeColumn(event.column);
              const filtered = this.gridStateLS.resizedArray.filter(item => item.colId !== event.column.getColId());
              this.gridStateLS.resizedArray = [...filtered];
              this.storageService.setGridState(this.tabName, this.gridStateLS);
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
              this.storageService.setGridState(this.tabName, this.gridStateLS);
            },
          }),
          alias: 'autosizeAll',
        },
        null,
        {
          data: event => ({
            name: 'Reset Columns',
            action: () => {
              this.gridStateLS = {visibleArray: [], pinnedArray: [], resizedArray: []};
              this.storageService.removeGridState(this.tabName);
              event.columnApi.resetColumnState();
              this.onResetColumns$.next();
              if (this.rowData) {
                this.fitColumnsToData(this.rowData).subscribe();
              }
            },
          }),
          alias: 'reset',
        },
      ]);
    }
    
    return {
      ...defaultGridOptions,
      rowBuffer: 10,
      enableFilter: true,
      enableCellChangeFlash: true,
      enableSorting: true,
      suppressRowClickSelection: false,
      deltaRowDataMode: false,
      rowSelection: 'single',
      gridAutoHeight: false,
      suppressNoRowsOverlay: true,
      getContextMenuItems,
      onCellDoubleClicked: (params) => this.onDoubleClicked$.next(params),
      onSelectionChanged: (params) => this.onSelectionChanged$.next(params),
      onGridReady: (readyEvent: GridReadyEvent) => {
        this.gridStateLS = gridStateLSInit(readyEvent.columnApi, this.tabName, this.gridStateLS);
        this.globalFiltersService.getFilters().pipe(
          takeUntil(this.destroy$),
        ).subscribe(() => readyEvent.api.refreshCells({force: true}));
        this.setTooltipDelay(readyEvent);
        this.onGridReady$.next(readyEvent);
      },
      onRowClicked: (event) => this.onRowClicked$.next(event),
      onColumnResized: (resizedEvent: ColumnResizedEvent) => this.gridEventsService.columnIsResized(resizedEvent, this.tabName, this.gridStateLS),
      onColumnVisible: (visibleEvent: ColumnVisibleEvent) => columnIsVisible(visibleEvent, this.tabName, this.gridStateLS),
      onColumnMoved: (movedEvent: ColumnMovedEvent) => columnIsMoved(movedEvent, this.tabName, this.gridStateLS),
      onColumnPinned: (pinnedEvent: ColumnPinnedEvent) => columnIsPinned(pinnedEvent, this.tabName, this.gridStateLS),
      ...overrides,
    };
    
    
  }
  
  onRowClicked(): Observable<RowClickedEvent> {
    return this.onRowClicked$.asObservable();
  }
  
  onDoubleClicked(): Observable<CellDoubleClickedEvent> {
    return this.onDoubleClicked$.asObservable();
  }
  
  onSelectionChanged(): Observable<SelectionChangedEvent> {
    return this.onSelectionChanged$.asObservable();
  }
  
  onGridReady(): Observable<GridReadyEvent> {
    return this.onGridReady$.asObservable();
  }
  
  onResetColumns(): Observable<void> {
    return this.onResetColumns$.asObservable();
  }
  
  resizeColumnsOnData(data: object[]): Observable<void> {
    return this.onGridReady$.pipe(
      take(1),
      switchMap(gridReadyEvent => this.fitColumnsToData(data).pipe(map(() => gridReadyEvent))),
      tap(gridReadyEvent => {
        setMaxColumnWidth(gridReadyEvent.columnApi);
        if (this.gridStateLS.resizedArray.length) {
          for (const item of this.gridStateLS.resizedArray) {
            gridReadyEvent.columnApi.setColumnWidth(item.colId, item.actualWidth, true);
          }
        }
      }),
      mapTo(null),
    );
  }
  
  setColumnsFromSchemaAndData(schema: SchemaTypeModel[], data: object[]): Observable<void> {
    return this.setColumnsAndData(this.columnsFromSchema(schema), data);
  }
  
  setColumnsAndData(columns: object[], data: object[]): Observable<void> {
    return this.onGridReady$.pipe(take(1)).pipe(
      switchMap(() => this.setColumns(columns)),
      switchMap(() => this.setRowData(data)),
      switchMap(() => this.resizeColumnsOnData(data)),
    );
  }
  
  setRowData(data: object[]): Observable<void> {
    return this.onGridReady$.pipe(
      take(1),
      tap(gridReadyEvent => {
        this.rowData = data;
        gridReadyEvent.api.setRowData(data);
        gridReadyEvent.api.redrawRows();
      }),
      mapTo(null),
    );
  }
  
  redrawRows(): Observable<void> {
    return this.onGridReady$.pipe(
      take(1),
      tap(gridReadyEvent => gridReadyEvent.api.redrawRows()),
      mapTo(null),
    );
  }
  
  setColumns(columns: object[]): Observable<void> {
    return this.onGridReady$.pipe(
      take(1),
      tap(gridReadyEvent => {
        gridReadyEvent.api.setColumnDefs(null);
        gridReadyEvent.api.setColumnDefs(columns);
      }),
      mapTo(null),
    );
  }
  
  columnsFromSchema(schema: SchemaTypeModel[]): object[] {
    const columns = schema.map(item => ({...item, name: item.name || DEFAULT_$TYPE_NAME}));
    return [
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
        width: 160,
        headerTooltip: 'Timestamp',
        cellRenderer: data => this.dateFormat(data),
        tooltipValueGetter: params => this.dateFormat(params),
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
      ...this.columnFromSchema(columns, this.columnsHiddenByDefault),
    ];
  }
  
  hideColumnsByDefault(state: boolean) {
    this.columnsHiddenByDefault = state;
  }
  
  dateFormat(params): string {
    return formatHDate(
      params.value,
      this.globalFilters?.dateFormat,
      this.globalFilters?.timeFormat,
      this.globalFilters?.timezone,
    );
  }
  
  cellFormatter(type: SchemaTypeModel): (params) => string {
    return (params) => {
      if ((type?.name === 'currencyCode' || type?.name === 'baseCurrency') && params.value && this.currencies.length) {
        const currency = this.currencies.find(item => item.numericCode === params.value);
        if (currency?.alphabeticCode) {
          return params.value + ' (' + currency.alphabeticCode + ')';
        } else {
          return params.value as string;
        }
      }
      if (typeof params.value === 'number') {
        if (String(params.value).indexOf('e') !== -1) {
          const exponent = parseInt(String(params.value).split('-')[1], 10);
          return params.value.toFixed(exponent);
        }
      }
      
      if (type?.type?.name === 'TIMESTAMP' && params.value) {
        return this.dateFormat(params);
      }
      if (params.value && typeof params.value === 'object') {
        return JSON.stringify(params.value);
      }
      
      return params.value as string;
    };
  }
  
  columnFromSchema(types: SchemaTypeModel[], hide: boolean, parentKey = '') {
    return types.map(type => {
      const field = parentKey + type.name.replace(/\./g, '-');
      const column = {
        headerName: type.title || type.name !== DEFAULT_$TYPE_NAME ? type.name : '',
        field,
        filter: false,
        sortable: false,
        resizable: true,
        headerTooltip: type.title || type.name,
        tooltipValueGetter: data => {
          const value = this.cellFormatter(type)(data);
          return value?.length > this.maxToolTipLength ? null : value;
        },
        hide: hide ? hide : type.hide,
        valueFormatter: this.cellFormatter(type),
      };
      
      if (type.fields) {
        column['children'] = this.columnFromSchema(type.fields, hide, column.field + '.');
        column['marryChildren'] = true;
      }
      return column;
    });
  }
  
  setTooltipDelay(gridApi: GridReadyEvent, delay = 0) {
    try {
      (gridApi.api as any).context.beanWrappers.tooltipManager.beanInstance.MOUSEOVER_SHOW_TOOLTIP_TIMEOUT = delay;
    } catch (e) {
      console.error(e);
    }
  }
  
  private fitColumnsToData(data: object[]): Observable<void> {
    return this.onGridReady$.pipe(
      take(1),
      tap((gridReadyEvent: GridReadyEvent) => {
        const cols: Column[] = gridReadyEvent.columnApi.getAllColumns();
        const columnsIdVisible = new Set<string>();
        
        if (cols && cols.length) {
          for (let i = 0; i < cols.length; i++) {
            const colIdArr = cols[i]['colId'].split('.');
            
            if (colIdArr.length === 2) {
              if (columnsIdVisible.has(cols[i]['colId'])) {
                return;
              }
              if (data.find(item => {
                if (item.hasOwnProperty(colIdArr[0])) {
                  return item[colIdArr[0]][colIdArr[1]];
                }
              })) {
                gridReadyEvent.columnApi.setColumnVisible(cols[i]['colId'], true);
                columnsIdVisible.add(cols[i]['colId']);
              }
            }
          }
        }
        this.gridStateLS = gridStateLSInit(gridReadyEvent.columnApi, this.tabName, this.gridStateLS);
      }),
      // Waiting for grid stop redrawing (autosize work with dom and needs stabled html)
      delay(100),
      tap(gridReadyEvent => autosizeAllColumns(gridReadyEvent.columnApi)),
      mapTo(null),
    );
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
