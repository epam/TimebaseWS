import {Injectable} from '@angular/core';
import {ColumnResizedEvent} from 'ag-grid-community';
import {GridStateModel} from '../../pages/streams/models/grid.state.model';
import { SchemaClassFieldModel } from '../models/schema.class.type.model';
import {GridColumnsService} from './grid-columns.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GridEventsService {
  rowSortingOrder = new Subject<{ [key: string]: string }>();

  constructor(private gridColumnsService: GridColumnsService) {}

  public selectedField = new Subject<SchemaClassFieldModel>();

  columnIsResized(resizedEvent: ColumnResizedEvent, tabName: string, gridStateLS: GridStateModel) {
    if (resizedEvent.finished && resizedEvent.source === 'uiColumnDragged') {
      this.gridColumnsService.onFinishResize(gridStateLS, resizedEvent, tabName);
    }
  }

  setRowSortingOrder(order: { [key: string]: string }) {
    this.rowSortingOrder.next(order);
  }
}
