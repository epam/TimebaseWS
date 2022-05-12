import {
  ColDef,
  ColGroupDef,
  ColumnApi,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnVisibleEvent,
  GridOptions,
} from 'ag-grid-community';
import {take} from 'rxjs/operators';
import {GridStateModel} from '../../../pages/streams/models/grid.state.model';
import {IsAbstractCbComponent} from '../../../pages/streams/modules/schema-editor/components/class-list-grid/grid-components/is-abstract-cb/is-abstract-cb.component';
import {IsUsedCbComponent} from '../../../pages/streams/modules/schema-editor/components/class-list-grid/grid-components/is-used-cb/is-used-cb.component';
import {TreeDataCellComponent} from '../../../pages/streams/modules/schema-editor/components/class-list-grid/grid-components/tree-data-cell/tree-data-cell.component';
import {ResolutionComponent} from '../../../pages/streams/modules/schema-editor/components/diff/grid-components/data-lost/resolution.component';
import {GridContextMenuService} from '../../grid-components/grid-context-menu.service';
import {GridHeaderGlobalMenuComponent} from '../../grid-components/grid-header-gobal-menu/grid-header-global-menu.component';
import {GridHeaderComponent} from '../../grid-components/grid-header/grid-header.component';
import {copyToClipboard} from '../copy';
import {CustomNoRowOverlayComponent} from './custom-no-rows-overlay.component';

let gridType = '';
const FIRST_COLUMN = 'first-column';

export const defaultGridOptions: GridOptions = {
  enableColResize: true,
  suppressCopyRowsToClipboard: true,
  processCellForClipboard: (params) => {
    if (typeof params.value === 'object') {
      return JSON.stringify(params.value);
    }
    return params.value;
  },
  processHeaderForClipboard: (params) => {
    if (typeof params === 'object') {
      return JSON.stringify(params);
    }
    return params;
  },
  processCellFromClipboard: (params) => {
    if (typeof params.value === 'object') {
      return JSON.stringify(params.value);
    }
    return params.value;
  },
  // localeText: gridLocaleText,
  popupParent: document.querySelector('body'),
  onColumnPinned: (props) => saveState(props, gridType),
  onColumnResized: (props) => saveState(props, gridType),
  onColumnMoved: (props) => saveState(props, gridType),
  onColumnRowGroupChanged: (props) => saveState(props, gridType),
  onColumnValueChanged: (props) => saveState(props, gridType),
  onColumnPivotModeChanged: (props) => saveState(props, gridType),
  onColumnPivotChanged: (props) => saveState(props, gridType),
  onColumnGroupOpened: (props) => saveState(props, gridType),
  onNewColumnsLoaded: (props) => saveState(props, gridType),
  onGridColumnsChanged: (props) => saveState(props, gridType),
  onDisplayedColumnsChanged: (props) => saveState(props, gridType),
  onVirtualColumnsChanged: (props) => saveState(props, gridType),
  // onSortChanged: (props) => saveState(props, gridType),
  // onFilterChanged: (props) => saveState(props, gridType),
  onDragStopped: (props) => saveState(props, gridType),
  // onToolPanelVisibleChanged: (props) => this.saveState(props),
  components: {
    agNoRowsOverlay: CustomNoRowOverlayComponent,
  },
  onModelUpdated: (event) => {
    const rows = (event.api as any).rowRenderer.rowCompsByIndex;
    if (Array.from(Object.keys(rows)).length > 0) {
      event.api.hideOverlay();
    } else {
      if (event.api) {
        event.api.showNoRowsOverlay();
      }
    }
  },
  defaultColDef: {
    lockPinned: true,
    headerComponent: 'GridHeaderComponent',
  },
  frameworkComponents: {
    isUsedCbComponent: IsUsedCbComponent,
    isAbstractCbComponent: IsAbstractCbComponent,
    treeDataCellComponent: TreeDataCellComponent,
    GridHeaderGlobalMenuComponent: GridHeaderGlobalMenuComponent,
    GridHeaderComponent: GridHeaderComponent,
    resolutionComponent: ResolutionComponent,
  },
};

export function saveState(props: GridOptions, type: string) {
  if (!type) {
    return;
  }
  const columnState = props.columnApi.getColumnState();
  const columnGroupState = props.columnApi.getColumnGroupState();

  localStorage.setItem('columnState' + type, JSON.stringify(columnState));
  localStorage.setItem('columnGroupState' + type, JSON.stringify(columnGroupState));
}

export function getGridType(type: string) {
  return (gridType = type);
}

export function processCellCallback(cell) {
  return cell.value && typeof cell.value === 'object' ? JSON.stringify(cell.value) : cell.value;
}

export function getContextMenuItems(params) {
  return [
    'copy',
    'copyWithHeaders',
    'paste',
    // 'resetColumns',
    {
      disabled: !(params.node && params.node.data && params.node.data.$type),
      name: 'Copy JSON',
      action: function () {
        const data = params.node.data;
        delete data.original;
        copyToClipboard(JSON.stringify(data)).pipe(take(1)).subscribe();
      },
    },
    'separator',
    {
      name: 'Export',
      subMenu: [
        {
          name: 'CSV Export',
          action: () => params.api.exportDataAsCsv({...params, processCellCallback}),
        },
        {
          name: 'Excel Export (.xlsx)',
          action: () => params.api.exportDataAsExcel({...params, processCellCallback}),
        },
        {
          name: 'Excel Export (.xml)',
          action: () =>
            params.api.exportDataAsExcel({...params, exportMode: 'xml', processCellCallback}),
        },
      ],
    },
  ];
}

export function columnIsVisible(
  visibleEvent: ColumnVisibleEvent,
  tabName: string,
  gridStateLS: GridStateModel,
) {
  if (GridContextMenuService.executing) {
    for (const col of visibleEvent.columns) {
      const item = gridStateLS.visibleArray.find((item) => item.colId === col['colId']);
      if (gridStateLS.visibleArray.length && item) {
        item.visible = visibleEvent.visible;
      } else {
        gridStateLS.visibleArray.push({colId: col['colId'], visible: visibleEvent.visible});
      }
    }
    localStorage.setItem('gridStateLS' + tabName, JSON.stringify(gridStateLS));
  }
  if (visibleEvent.source === 'columnMenu' && visibleEvent.column) {
    const item = gridStateLS.visibleArray.find(
      (item) => item.colId === visibleEvent.column['colId'],
    );
    if (gridStateLS.visibleArray.length && item) {
      item.visible = visibleEvent.visible;
    } else {
      gridStateLS.visibleArray.push({
        colId: visibleEvent.column['colId'],
        visible: visibleEvent.visible,
      });
    }
    localStorage.setItem('gridStateLS' + tabName, JSON.stringify(gridStateLS));
  }
}

export function columnIsPinned(
  pinnedEvent: ColumnPinnedEvent,
  tabName: string,
  gridStateLS: GridStateModel,
) {
  if (
    (GridContextMenuService.executing || pinnedEvent.source === 'uiColumnDragged') &&
    pinnedEvent.column
  ) {
    const item = gridStateLS.pinnedArray.find((item) => item.colId === pinnedEvent.column['colId']);
    if (gridStateLS.pinnedArray.length && item) {
      item.pinned = pinnedEvent.pinned;
    } else {
      gridStateLS.pinnedArray.push({
        colId: pinnedEvent.column['colId'],
        pinned: pinnedEvent.pinned,
      });
    }
    localStorage.setItem('gridStateLS' + tabName, JSON.stringify(gridStateLS));
  }
}

export function columnIsMoved(
  movedEvent: ColumnMovedEvent,
  tabName: string,
  gridStateLS: GridStateModel,
) {
  if (movedEvent.source === 'uiColumnDragged') {
    gridStateLS.updatedColumnPrevs = {};
    const originalSeq = getColSeq(movedEvent.columnApi.getAllColumns() as any);
    const newSeq = getColSeq(movedEvent.columnApi.getColumnState());
    Array.from(newSeq.keys()).forEach((colId) => {
      if (newSeq.get(colId) !== originalSeq.get(colId)) {
        gridStateLS.updatedColumnPrevs[colId] = newSeq.get(colId);
      }
    });
    localStorage.setItem('gridStateLS' + tabName, JSON.stringify(gridStateLS));
  }
}

function getColSeq(columns: {colId: string}[]): Map<string, string> {
  let prev = FIRST_COLUMN;
  const seq = new Map();
  columns.forEach((col) => {
    seq.set(prev, col.colId);
    prev = col.colId;
  });

  return seq;
}

export function gridStateLSInit(
  columnApi: ColumnApi,
  tabName: string,
  gridStateLS: GridStateModel,
) {
  if (localStorage.getItem('gridStateLS' + tabName)) {
    const allColumns = columnApi.getAllColumns();
    if (allColumns && allColumns.length) {
      gridStateLS = JSON.parse(localStorage.getItem('gridStateLS' + tabName));
      if (gridStateLS.visibleArray.length) {
        for (const item of gridStateLS.visibleArray) {
          columnApi.setColumnVisible(item.colId, item.visible);
        }
      }
      if (gridStateLS.pinnedArray.length) {
        for (const item of gridStateLS.pinnedArray) {
          columnApi.setColumnPinned(item.colId, item.pinned);
        }
      }

      const positionUpdates = gridStateLS.updatedColumnPrevs;
      if (positionUpdates && Object.keys(positionUpdates).length) {
        const colState = columnApi.getColumnState();
        const byId = new Map();
        colState.forEach((col) => byId.set(col.colId, col));
        const newState = [];
        const seq = getColSeq(colState);
        const newStateIds = new Set();
        const removedKeys = new Map();
        const buildSeq = (prev: string) => {
          let id = seq.get(prev);
          if (positionUpdates[prev]) {
            id = positionUpdates[prev];
            const removeKey = Array.from(seq.keys()).find((key) => seq.get(key) === id);
            removedKeys.set(removeKey, id);
            seq.delete(removeKey);
          }

          const col = byId.get(id);

          if (!col) {
            return;
          }

          newState.push(col);
          newStateIds.add(col.colId);
          buildSeq(col.colId);
        };

        buildSeq(FIRST_COLUMN);

        // New columns, that were not presented on state saving
        colState
          .filter((c) => !newStateIds.has(c.colId))
          .forEach((col) => {
            const insertAfter = removedKeys.get(col.colId);
            const index = newState.findIndex((c) => c.colId === insertAfter) + 1;
            newState.splice(index, 0, col);
          });

        columnApi.setColumnState(newState);
      }
    }
  }
  return gridStateLS;
}

export function setMaxColumnWidth(columnApi: ColumnApi) {
  const displayedCols = columnApi.getAllDisplayedColumns();
  if (!displayedCols.length) {
    return;
  }

  const cc: any = columnApi['columnController'];
  let gridWidth = cc.leftWidth + cc.rightWidth + cc.scrollWidth;
  const columnWidths = {};
  displayedCols.forEach((col) => {
    const actualWidth = col.getActualWidth();
    const width = actualWidth > 500 ? 500 : actualWidth;
    const cutWidth = actualWidth - width;
    gridWidth -= width;
    columnWidths[col.getColId()] = {actualWidth, width, cutWidth};
  });

  let cutWiths = Object.values(columnWidths)
    .map(({cutWidth}) => cutWidth)
    .filter(Boolean);

  if (gridWidth > 0 && cutWiths.length) {
    const shareWidth = () => {
      const colsLength = cutWiths.length;
      const width = gridWidth / colsLength;
      const minCutWidth = cutWiths.length ? Math.min(...cutWiths) : 0;
      const share = Math.min(...[minCutWidth, width].filter(Boolean));
      Object.keys(columnWidths).forEach((colId) => {
        if (columnWidths[colId].cutWidth) {
          columnWidths[colId].cutWidth -= share;
          columnWidths[colId].width += share;
          gridWidth -= share;
        }
      });
      cutWiths = cutWiths.map((cw) => cw - share).filter(Boolean);

      if (cutWiths.length && gridWidth > 0) {
        shareWidth();
      }
    };

    shareWidth();
  }

  Object.keys(columnWidths).forEach((colId) => {
    columnApi.setColumnWidth(colId, columnWidths[colId].width, true);
  });
}

export function autosizeAllColumns(columnApi: ColumnApi) {
  columnApi.autoSizeAllColumns();
  setMaxColumnWidth(columnApi);
}

export function columnsVisibleColumn(withChild = true): ColGroupDef | ColDef {
  const cell = {
    headerName: '',
    colId: 'GridHeaderGlobalMenuComponent',
    pinned: true,
    maxWidth: 30,
    width: 30,
    filter: false,
    lockPosition: true,
  };
  if (!withChild) {
    return {...cell, headerComponent: 'GridHeaderGlobalMenuComponent'};
  }

  return {
    headerGroupComponent: 'GridHeaderGlobalMenuComponent',
    children: [cell],
  };
}
