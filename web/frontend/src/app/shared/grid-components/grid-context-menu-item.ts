import {Column, ColumnApi} from 'ag-grid-community';

export class GridContextMenuItem<T> {
  data: (event: T) => GridContextMenuItemData;
  alias: string;
}

export class GridContextMenuItemData {
  name: string;
  action: () => void;
  disabled?: boolean;
}

export class GridColumnMenuEvent {
  columnApi: ColumnApi;
  column: Column;
}
