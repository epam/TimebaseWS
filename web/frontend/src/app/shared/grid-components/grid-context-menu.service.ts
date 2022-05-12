import {Injectable} from '@angular/core';
import {CellContextMenuEvent} from 'ag-grid-community';
import {BehaviorSubject, Observable, timer} from 'rxjs';
import {autosizeAllColumns} from '../utils/grid/config.defaults';
import {GridColumnMenuEvent, GridContextMenuItem} from './grid-context-menu-item';

@Injectable()
export class GridContextMenuService {
  static executing = false;
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
