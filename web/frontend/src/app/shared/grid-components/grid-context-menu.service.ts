import {Injectable}                                    from '@angular/core';
import { CellContextMenuEvent, Column, ColumnApi }     from 'ag-grid-community';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { GridStateModel }                              from '../../pages/streams/models/grid.state.model';
import { StorageService }                                        from '../services/storage.service';
import { autosizeAllColumns, autosizeMaxWidth, gridStateLSInit } from '../utils/grid/config.defaults';
import {GridColumnMenuEvent, GridContextMenuItem}                from './grid-context-menu-item';

@Injectable()
export class GridContextMenuService {
  static executing = false;
  
  constructor(private storageService: StorageService) {
  }
  
  private defaultColMenu = [
    {
      data: (event) => ({
        name: 'Autosize This Column',
        action: () => event.columnApi.autoSizeColumn(event.column),
      }),
      alias: 'autosize',
    },
    {
      data: (event) => ({
        name: 'Autosize All Columns',
        action: () => autosizeAllColumns(event.columnApi),
      }),
      alias: 'autosizeAll',
    },
    null,
    {
      data: (event) => ({
        name: 'Reset Columns',
        action: () => event.columnApi.resetColumnState(),
      }),
      alias: 'reset',
    },
    {
      data: (event) => ({
        name: 'Reset this',
        action: () => event.column.resetColumnState(),
      }),
      alias: 'resetThis',
    },
  ];

  private cellMenuItems$ = new BehaviorSubject<GridContextMenuItem<CellContextMenuEvent>[]>([]);
  private columnMenuItems$ = new BehaviorSubject<GridContextMenuItem<GridColumnMenuEvent>[]>(
    this.defaultColMenu,
  );
  private disableColumns$ = new BehaviorSubject<boolean>(false);

  static viaContextMenu(callback: () => void) {
    GridContextMenuService.executing = true;
    callback();
    timer().subscribe(() => (GridContextMenuService.executing = false));
  }

  addCellMenuItems(items: GridContextMenuItem<CellContextMenuEvent>[]) {
    this.cellMenuItems$.next(items);
  }

  onCellMenuItems(): Observable<GridContextMenuItem<CellContextMenuEvent>[]> {
    return this.cellMenuItems$.asObservable();
  }

  addColumnMenuItems(items: GridContextMenuItem<GridColumnMenuEvent>[]) {
    const value = this.columnMenuItems$.getValue();
    items.forEach((item) => {
      const index = value.findIndex((_item) => _item?.alias === item?.alias);
      if (index > -1) {
        value[index] = item;
      }
    });
    this.columnMenuItems$.next(value);
  }
  
  addColumnSizeMenuItems(getState: () => GridStateModel, getRowData: () => any, tabName: string, defaultPinned = ['symbol', 'timestamp']) {
    const reset$ = new Subject<GridColumnMenuEvent>();
    this.addColumnMenuItems([
      {
        data: (event) => ({
          name: 'Autosize This Column',
          action: () => {
            event.columnApi.autoSizeColumn(event.column);
            const filtered = getState().resizedArray.filter(
              (item) => item.colId !== event.column.getColId(),
            );
            const state = getState();
            state.resizedArray = [...filtered];
            if (!state.autoSized?.includes(event.column.getColId())) {
              state.autoSized = state.autoSized || [];
              state.autoSized.push(event.column.getColId());
            }
            this.storageService.setGridState(tabName, state);
          },
        }),
        alias: 'autosize',
      },
      {
        data: (event) => ({
          name: 'Autosize All Columns',
          action: () => {
            autosizeAllColumns(event.columnApi, false);
            const state = getState();
            state.resizedArray = [];
            event.columnApi.getAllColumns().forEach(col => state.autoSized.push(col.getColId()));
            this.storageService.setGridState(tabName, state);
          },
        }),
        alias: 'autosizeAll',
      },
      {
        data: (event) => ({
          name: 'Reset Columns',
          action: () => {
            const state = getState();
            state.visibleArray = [];
            state.pinnedArray = [];
            state.resizedArray = [];
            state.autoSized = [];
            this.storageService.setGridState(tabName, state);
            const rowData = getRowData();
            if (rowData) {
              event.columnApi.resetColumnState();
              reset$.next(event);
              timer(100).subscribe(() => autosizeAllColumns(event.columnApi));
            }
          },
        }),
        alias: 'reset',
      },
      {
        data: (event) => ({
          name: 'Reset this',
          action: () => {
            const state = getState();
            const removeColId = (array: any[], getAttribute: (item) => string) => {
              const index = array.findIndex(item => getAttribute(item) === event.column.getColId());
              
              if (index > -1) {
                array.splice(index, 1);
                return true;
              }
            };
            
            removeColId(state.resizedArray, (item => item.colId));
            removeColId(state.autoSized, (item => item));
            
            if (removeColId(state.pinnedArray, (item => item.colId))) {
              event.columnApi.setColumnPinned(event.column.getColId(), defaultPinned.includes(event.column.getColId()) ? 'left' : null);
            }
          
            event.columnApi.autoSizeColumn(event.column.getColId());
            if (event.column.getActualWidth() > autosizeMaxWidth) {
              const cc: any = event.columnApi['columnController'];
              const gridWidth = cc.leftWidth + cc.rightWidth + cc.scrollWidth;
              const otherColsSum = event.columnApi.getAllDisplayedColumns()
                .reduce((sum, col) =>
                  col.getColId() !== event.column.getColId() ? (sum + col.getActualWidth()) : sum,
                  0) + 1;
              
              const space = gridWidth - otherColsSum;
              const colWidth = Math.min(Math.max(autosizeMaxWidth, space), event.column.getActualWidth());
              event.columnApi.setColumnWidth(event.column.getColId(), colWidth, true);
            }
  
            state.resizedArray.push({colId: event.column.getColId(), actualWidth: event.column.getActualWidth()});
  
            this.storageService.setGridState(tabName, state);
          },
        }),
        alias: 'resetThis',
      },
    ]);
    
    return reset$.asObservable();
  }

  onColumnMenuItems(): Observable<GridContextMenuItem<GridColumnMenuEvent>[]> {
    return this.columnMenuItems$.asObservable();
  }

  disableColumns() {
    this.disableColumns$.next(true);
  }

  onDisableColumns(): Observable<boolean> {
    return this.disableColumns$.asObservable();
  }
}
