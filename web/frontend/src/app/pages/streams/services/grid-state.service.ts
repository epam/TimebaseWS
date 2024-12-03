import { Injectable } from '@angular/core';
import { ColumnState } from 'ag-grid-community/dist/lib/columnController/columnController';

@Injectable({
  providedIn: 'root',
})
export class GridStateService {

  private columnState: { [streamId: string]: ColumnState[] } = {}

  constructor() {

    const savedColumnState = sessionStorage.getItem('gridColumnState');
    if (savedColumnState) {
      this.columnState = JSON.parse(savedColumnState);
    }
  }


  updateColumnState(streamId: string, columns: ColumnState[]) {
    this.columnState[streamId] = columns;
    sessionStorage.setItem('gridColumnState', JSON.stringify(this.columnState));
  }

  getColumnState(streamId: string) {
    return this.columnState[streamId];
  }
}