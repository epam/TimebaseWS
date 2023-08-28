import { Injectable, OnDestroy, Optional }                                    from '@angular/core';
import { Store } from '@ngrx/store';
import {
  CellDoubleClickedEvent,
  CellPosition,
  Column,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ICellRendererParams,
  NavigateToNextCellParams,
  PinnedRowDataChangedEvent,
  RowClickedEvent,
  SelectionChangedEvent,
}                                                                             from 'ag-grid-community';
import { CellKeyDownEvent } from 'ag-grid-community/dist/lib/events';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject, Subject }       from 'rxjs';
import { debounceTime, delay, filter, map, mapTo, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { AppState } from 'src/app/core/store';
import { SetSelectedSchemaItem } from 'src/app/pages/streams/modules/schema-editor/store/schema-editor.actions';
import { GridStateModel }                                                           from '../../pages/streams/models/grid.state.model';
import { GridTotalService }                                                         from '../components/grid-total/grid-total.service';
import { GridContextMenuService }                                                   from '../grid-components/grid-context-menu.service';
import { formatHDate }                                                              from '../locale.timezone';
import { Currency }                                                                 from '../models/currency';
import { GlobalFilters }                                                            from '../models/global-filters';
import { RowsLoadInfo }                                                             from '../models/rows-load-info';
import { SchemaTypeModel }                                                          from '../models/schema.type.model';
import { eventKeyMatchesTarget } from '../utils/eventKeyMatchesTarget';
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
}                                                                                   from '../utils/grid/config.defaults';
import { GlobalFiltersService } from './global-filters.service';
import { GridEventsService }    from './grid-events.service';
import { TabNavigationService } from './tab-navigation.service';
import { TabStorageService }    from './tab-storage.service';

@Injectable()
export class GridService implements OnDestroy {
  columnsHiddenByDefault = true;
  onResetColumns$ = new Subject<void>();
  
  private onDoubleClicked$ = new Subject<CellDoubleClickedEvent>();
  private onRowClicked$ = new Subject<RowClickedEvent>();
  private pinnedChanged$ = new Subject<PinnedRowDataChangedEvent>();
  private onSelectionChanged$ = new Subject<SelectionChangedEvent>();
  private onGridReady$ = new ReplaySubject<GridReadyEvent>(1);
  private gridName$ = new BehaviorSubject(null);
  private gridStateLS: GridStateModel = {visibleArray: [], resizedArray: [], pinnedArray: [], autoSized: []};
  private rowData$ = new BehaviorSubject<object[]>(null);
  private destroy$ = new ReplaySubject(1);
  private globalFilters: GlobalFilters;
  private currencies: Currency[];
  private maxToolTipLength = 100;
  private hasInfinityScroll: boolean;
  private cellFormatting$ = new Subject<void>();
  public gridApi: GridApi;
  
  constructor(
    private appStore: Store<AppState>,
    private gridEventsService: GridEventsService,
    private globalFiltersService: GlobalFiltersService,
    private tabStorageService: TabStorageService<unknown>,
    private tabNavigationService: TabNavigationService,
    @Optional() private gridContextMenuService: GridContextMenuService,
    @Optional() private gridTotalService: GridTotalService,
  ) {
    this.currencies = JSON.parse(localStorage.getItem('currencies'));
    this.globalFiltersService
      .getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe((globalFilters) => {
        this.globalFilters = globalFilters;
      });
  }
  
  options(tabName: string, overrides: GridOptions = {}): GridOptions {
    this.gridName$.next(tabName);
    
    if (this.gridContextMenuService) {
      this.gridContextMenuService.addColumnSizeMenuItems(
        () => this.gridStateLS,
        () => this.rowData$.getValue(),
        this.gridName$.getValue(),
      ).pipe(takeUntil(this.destroy$)).subscribe((event) => {
        this.onResetColumns$.next();
        if (this.rowData$.getValue()) {
          this.fitColumnsToData(this.rowData$.getValue()).subscribe();
        }
      });
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
      floatingFilter: true,
      floatingFiltersHeight: 0,
      suppressNoRowsOverlay: true,
      rowModelType: this.hasInfinityScroll ? 'infinite' : null,
      getContextMenuItems,
      onCellDoubleClicked: (params) => this.onDoubleClicked$.next(params),
      onSelectionChanged: (params) => this.onSelectionChanged$.next(params),
      onGridReady: (readyEvent: GridReadyEvent) => {
        this.gridStateLS = gridStateLSInit(readyEvent.columnApi, this.gridName$.getValue(), this.gridStateLS);
        this.gridApi = readyEvent.api;
        this.globalFiltersService
          .getFilters()
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => readyEvent.api.refreshCells({force: true}));
        this.setTooltipDelay(readyEvent);
        this.onGridReady$.next(readyEvent);
      },
      onRowClicked: (event) => this.onRowClicked$.next(event),
      onPinnedRowDataChanged: (event) => this.pinnedChanged$.next(event),
      onColumnResized: (resizedEvent: ColumnResizedEvent) =>
        this.gridEventsService.columnIsResized(resizedEvent, this.gridName$.getValue(), this.gridStateLS),
      onColumnVisible: (visibleEvent: ColumnVisibleEvent) =>
        columnIsVisible(visibleEvent, this.gridName$.getValue(), this.gridStateLS),
      onColumnMoved: (movedEvent: ColumnMovedEvent) =>
        columnIsMoved(movedEvent, this.gridName$.getValue(), this.gridStateLS),
      onColumnPinned: (pinnedEvent: ColumnPinnedEvent) =>
        columnIsPinned(pinnedEvent, this.gridName$.getValue(), this.gridStateLS),
      navigateToNextCell: (params: NavigateToNextCellParams) => this.upDownKeysNavigation(this.gridApi, params),
      onCellKeyDown: (event: CellKeyDownEvent) => this.onKeyDown(event),
      ...overrides,
    };
  }
  
  onRowClicked(): Observable<RowClickedEvent> {
    return this.onRowClicked$.asObservable();
  }
  
  onPinnedChanged(): Observable<PinnedRowDataChangedEvent> {
    return this.pinnedChanged$.asObservable();
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
      switchMap((gridReadyEvent) => this.fitColumnsToData(data).pipe(map(() => gridReadyEvent))),
      tap((gridReadyEvent) => {
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
  
  infinityScroll(
    callback: (startRow: number, endRow: number) => Observable<any>,
  ): Observable<void> {
    this.hasInfinityScroll = true;
    let dataSourceSet = false;
    return combineLatest([this.onGridReady$, this.rowData$.pipe(filter((d) => !!d))]).pipe(
      tap(([gridReady, initialData]) => {
        gridReady.api.setDatasource({
          getRows: (params) => {
            if (dataSourceSet) {
              this.gridTotalService?.startLoading();
            }
            const finish = (data) => {
              if (dataSourceSet) {
                this.gridTotalService?.endLoading(data.length);
              }
              dataSourceSet = true;
              params.successCallback(
                data,
                data.length < params.endRow - params.startRow ? params.startRow + data.length : -1,
              );
            };
            
            if (params.startRow === 0) {
              finish(initialData);
              return;
            }
            callback(params.startRow, params.endRow)
              .pipe(take(1))
              .subscribe((data) => finish(data));
            
          },
        });
      }),
      mapTo(null),
    );
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
      tap((gridReadyEvent) => {
        this.rowData$.next(data);
        gridReadyEvent.api.setRowData(data);
        gridReadyEvent.api.redrawRows();
      }),
      mapTo(null),
    );
  }
  
  redrawRows(): Observable<void> {
    return this.onGridReady$.pipe(
      take(1),
      tap((gridReadyEvent) => gridReadyEvent.api.redrawRows()),
      mapTo(null),
    );
  }
  
  setColumns(columns: object[]): Observable<void> {
    return this.onGridReady$.pipe(
      take(1),
      tap((gridReadyEvent) => {
        gridReadyEvent.api.setColumnDefs(null);
        gridReadyEvent.api.setColumnDefs(columns);
      }),
      mapTo(null),
    );
  }
  
  columnsFromSchema(schema: SchemaTypeModel[]): object[] {
    const columns = schema.map((item) => ({...item, name: item.name || ''}));
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
        width: 180,
        headerTooltip: 'Timestamp',
        cellRenderer: (params: ICellRendererParams) => this.dateFormat(params, params.data?.nanoTime, true),
        tooltipValueGetter: (params: ICellRendererParams) => this.dateFormat(params, params.data?.nanoTime, true),
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
  
  dateFormat(params, nanoTime = '', showNanoSeconds = false, periodicity = 0): string {
    return formatHDate(
      params.value,
      this.globalFilters?.dateFormat,
      this.globalFilters?.timeFormat,
      this.globalFilters?.timezone,
      true,
      nanoTime,
      showNanoSeconds,
      periodicity
    );
  }
  
  cellFormatter(type: SchemaTypeModel): (params) => string {
    return (params) => {
      const getValue = () => {
        if (
          (type?.name === 'currencyCode' || type?.name === 'baseCurrency') &&
          params.value &&
          this.currencies?.length
        ) {
          const currency = this.currencies.find((item) => item.numericCode === params.value);
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
      
      const value = getValue();
      this.cellFormatting$.next();
      return value;
    };
  }
  
  onCellFormatting(): Observable<void> {
    return this.cellFormatting$.pipe(debounceTime(0));
  }
  
  columnFromSchema(types: SchemaTypeModel[], hide: boolean, parentKey = '') {
    return types.map((type) => {
      const field = parentKey + type.name.replace(/\./g, '-');
      const column = {
        headerName: type.title || type.name || '',
        field,
        filter: false,
        sortable: false,
        resizable: true,
        headerTooltip: type.title || type.name,
        tooltipValueGetter: (data) => {
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
      (
        gridApi.api as any
      ).context.beanWrappers.tooltipManager.beanInstance.MOUSEOVER_SHOW_TOOLTIP_TIMEOUT = delay;
    } catch (e) {
      console.error(e);
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
              if (
                data.find((item) => {
                  if (item.hasOwnProperty(colIdArr[0])) {
                    return item[colIdArr[0]][colIdArr[1]];
                  }
                })
              ) {
                gridReadyEvent.columnApi.setColumnVisible(cols[i]['colId'], true);
                columnsIdVisible.add(cols[i]['colId']);
              }
            }
          }
        }
        this.gridStateLS = gridStateLSInit(
          gridReadyEvent.columnApi,
          this.gridName$.getValue(),
          this.gridStateLS,
        );
      }),
      // Waiting for grid stop redrawing (autosize work with dom and needs stabled html)
      delay(100),
      tap((gridReadyEvent) => autosizeAllColumns(gridReadyEvent.columnApi, true, this.gridStateLS.autoSized || [])),
      mapTo(null),
    );
  }
  
  gridName(): Observable<string> {
    return this.gridName$.asObservable();
  }
  
  gridStorage<T>(): Observable<TabStorageService<T>> {
    return this.gridName().pipe(
      take(1),
      map(gridName => this.tabStorageService.flow<T>(gridName)),
    );
  }

  private onKeyDown(e) {
    if (eventKeyMatchesTarget(e.event.key, ['Enter'])) {
      if (e.data._props && e.data._props._parentName) {
        this.appStore.dispatch(SetSelectedSchemaItem({itemName: e.data._props._parentName}));
      }
    } else {
      this.tabKeyNavigation(e);
    }
  }

  public tabKeyNavigation(e, navigateToFirstRow = false) {
    if (!eventKeyMatchesTarget(e.key ?? e.event.key, ['Tab'])) {
      return;
    }

    if (e.event) {
      e.event.preventDefault();
    }

    const focusedElementGridContainer = document.activeElement.closest('as-split-area');
    let nextContainer = focusedElementGridContainer.nextElementSibling as HTMLElement;
    if (nextContainer.classList.contains('as-hidden')) {
      nextContainer = document.querySelector('app-right-toolbar');
    }
    let selectedGridCell = nextContainer.querySelector('.ag-row-selected');
    if (!selectedGridCell && navigateToFirstRow) {
      selectedGridCell = nextContainer.querySelector('.ag-row');
    }

    if (selectedGridCell) {
      this.focusGridCell(selectedGridCell as HTMLElement);
    } else {
      this.tabNavigationService.focusFirstFocusableElement(nextContainer);
    }
  }

  public upDownKeysNavigation(gridApi: GridApi, params: NavigateToNextCellParams) { 

    const previousCell = params.previousCellPosition;
    const suggestedNextCell = params.nextCellPosition;
   
    const KEY_UP = 38;
    const KEY_DOWN = 40;
   
    switch (params.key) {
      case KEY_DOWN:
        gridApi.forEachNode((node) => {
          if (previousCell.rowIndex + 1 === node.rowIndex) {
            node.setSelected(true);
            this.deselectGridCell(previousCell);
          }
        });
        return suggestedNextCell;
      case KEY_UP:
        gridApi.forEachNode((node) => {
          if (previousCell.rowIndex - 1 === node.rowIndex) {
            node.setSelected(true);
            this.deselectGridCell(previousCell);
          }
        });
        return suggestedNextCell;
      default:
        return suggestedNextCell;
    }
  }

  focusGridCell(gridCell: HTMLElement) {
    if (!gridCell.classList.contains('ag-row-selected')) {
      const gridTable = gridCell.closest('ag-grid-angular');
      const focusedRowIndex = gridCell.getAttribute('row-index');
      const focusedRow = gridTable.querySelectorAll(`[row-index="${focusedRowIndex}"]`);
      Array.from(focusedRow).forEach(el => el.classList.add('ag-row-selected'));
    }

    (gridCell.firstChild as HTMLElement).focus();
    gridCell.setAttribute('navigatedWithTab', '');
  }

  deselectGridCell(gridCell: CellPosition) {
    const gridContainer = document.activeElement.closest('ag-grid-angular');
    const focusedGridCell = gridContainer.querySelector(`[row-index="${gridCell.rowIndex}"]`);

    if (focusedGridCell.hasAttribute('navigatedWithTab')) {
      const previousRow = gridContainer.querySelectorAll(`[row-index="${gridCell.rowIndex}"]`);
      Array.from(previousRow).forEach(el => el.classList.remove('ag-row-selected'));
      focusedGridCell.removeAttribute('navigatedWithTab');
    }
  }
}
