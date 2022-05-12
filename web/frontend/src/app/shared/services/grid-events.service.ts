import {Injectable} from '@angular/core';
import {ColumnResizedEvent} from 'ag-grid-community';
import {GridStateModel} from '../../pages/streams/models/grid.state.model';
import {GridColumnsService} from './grid-columns.service';

@Injectable({
  providedIn: 'root',
})
export class GridEventsService {
  constructor(private gridColumnsService: GridColumnsService) {}

  columnIsResized(resizedEvent: ColumnResizedEvent, tabName: string, gridStateLS: GridStateModel) {
    if (resizedEvent.finished && resizedEvent.source === 'uiColumnDragged') {
      this.gridColumnsService.onFinishResize(gridStateLS, resizedEvent, tabName);
    }
  }
}
