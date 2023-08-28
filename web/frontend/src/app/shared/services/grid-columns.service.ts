import {Injectable} from '@angular/core';
import {ColumnResizedEvent} from 'ag-grid-community';
import {GridStateModel} from '../../pages/streams/models/grid.state.model';

@Injectable({
  providedIn: 'root',
})
export class GridColumnsService {
  onFinishResize(gridStateLS: GridStateModel, resizedEvent: ColumnResizedEvent, tabName: string) {
    this.checkContentAreaNotCollapsed(resizedEvent);
    this.saveStateInLS(gridStateLS, resizedEvent, tabName);
  }

  checkContentAreaNotCollapsed(resizedEvent: ColumnResizedEvent) {
    const minWidthContentArea = 100;
    let pinnedWidth = 0;
    resizedEvent.columnApi
      .getAllColumns()
      .filter((col) => col.isPinned() && col.isVisible())
      .forEach((col) => (pinnedWidth += col.getActualWidth()));
    const gridWidth = document.querySelector('ag-grid-angular').getBoundingClientRect().width;
    const contentAreaWidth = gridWidth - pinnedWidth;

    if (contentAreaWidth < minWidthContentArea) {
      const diff = minWidthContentArea - contentAreaWidth;
      resizedEvent.columnApi.setColumnWidth(
        resizedEvent.column,
        resizedEvent.column.getActualWidth() - diff,
      );
    }
  }

  saveStateInLS(gridStateLS: GridStateModel, resizedEvent: ColumnResizedEvent, tabName) {
    resizedEvent.columns.forEach((column) => {
      const index = (gridStateLS.autoSized || []).findIndex(a => a === column['colId']);
      if (index > -1) {
        gridStateLS.autoSized.splice(index, 1);
      }
      const item = gridStateLS.resizedArray.find((item) => item.colId === column['colId']);
      if (gridStateLS.resizedArray.length && item) {
        item.actualWidth = column.getActualWidth();
      } else {
        gridStateLS.resizedArray.push({
          colId: column['colId'],
          actualWidth: column.getActualWidth(),
        });
      }
    });

    localStorage.setItem('gridStateLS' + tabName, JSON.stringify(gridStateLS));
  }
}
