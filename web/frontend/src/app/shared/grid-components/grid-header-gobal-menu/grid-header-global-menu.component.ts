import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild,
} from '@angular/core';
import {UntypedFormControl} from '@angular/forms';
import {StorageMap} from '@ngx-pwa/local-storage';
import {IHeaderAngularComp} from 'ag-grid-angular';
import {
  CellContextMenuEvent,
  ColumnApi,
  IHeaderParams,
  OriginalColumnGroup,
} from 'ag-grid-community';
import {ContextMenuComponent} from '@perfectmemory/ngx-contextmenu';
import {fromEvent, Observable, of, Subject, timer} from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  skip,
  startWith,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {TreeItem} from '../../components/tree-checkboxes/tree-item';
import {ContextMenuControlService} from '../../services/context-menu-control.service';
import {copyToClipboard} from '../../utils/copy';
import {GridContextMenuItemData} from '../grid-context-menu-item';
import {GridContextMenuService} from '../grid-context-menu.service';

@Component({
  selector: 'app-grid-header-global-menu',
  templateUrl: './grid-header-global-menu.component.html',
  styleUrls: ['./grid-header-global-menu.component.scss'],
})
export class GridHeaderGlobalMenuComponent implements OnInit, OnDestroy, IHeaderAngularComp {
  columnsTree: TreeItem[];
  columnsControl = new UntypedFormControl([]);
  cellMenuItems: GridContextMenuItemData[];
  copyJsonEnabled: boolean;
  disableColumns$: Observable<boolean>;
  @ViewChild('columnsMenu', {read: ContextMenuComponent})
  private columnsMenu: ContextMenuComponent;
  @ViewChild('cellMenu', {read: ContextMenuComponent}) private cellMenu: ContextMenuComponent;
  private columnApi: ColumnApi;
  private rootColumns = new Set<string>();
  private columnsById = new Map<string, TreeItem>();
  private destroy$ = new Subject();
  private updatingFromControl = false;

  constructor(
    private storage: StorageMap,
    private contextMenuControlService: ContextMenuControlService,
    private elementRef: ElementRef,
    private cdRef: ChangeDetectorRef,
    @Optional() private gridContextMenuService: GridContextMenuService,
  ) {}

  ngOnInit(): void {
    this.disableColumns$ = this.gridContextMenuService?.onDisableColumns() || of(false);
    this.columnsControl.valueChanges
      .pipe(
        distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
        skip(1),
        takeUntil(this.destroy$),
        map((data) => {
          this.updatingFromControl = true;
          GridContextMenuService.viaContextMenu(() => this.setColumnsSize(data));
        }),
      )
      .subscribe(() => (this.updatingFromControl = false));
  }

  agInit(params: IHeaderParams): void {
    this.columnApi = params.columnApi;
    fromEvent(params.api, 'columnVisible')
      .pipe(
        startWith(null),
        takeUntil(this.destroy$),
        filter(() => !this.updatingFromControl),
      )
      .subscribe(() => {
        this.buildTree();
        this.updateSelected();
      });

    fromEvent(params.api, 'cellContextMenu')
      .pipe(takeUntil(this.destroy$))
      .subscribe((rowEvent: CellContextMenuEvent) => this.showCellContextMenu(rowEvent));

    fromEvent(params.api, 'bodyScroll')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.contextMenuControlService.closeMenu('cell-menu'));

    fromEvent(
      this.elementRef.nativeElement.parentElement.querySelector('.ag-body-viewport'),
      'contextmenu',
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: MouseEvent) => {
        event.stopPropagation();
        event.stopImmediatePropagation();
        event.preventDefault();
      });
  }

  showContextMenu(event: MouseEvent) {
    this.contextMenuControlService.show(
      {
        contextMenu: this.columnsMenu,
        event: event,
        item: undefined,
      },
      'all-columns-menu',
    );
  }

  copy(cellEvent: CellContextMenuEvent) {
    copyToClipboard(this.getValue(cellEvent)).pipe(take(1)).subscribe();
  }

  copyWithHeaders(cellEvent: CellContextMenuEvent) {
    copyToClipboard(`${cellEvent.colDef.headerName}: ${this.getValue(cellEvent)}`).pipe(take(1)).subscribe();
  }

  copyJSON(cellEvent: CellContextMenuEvent) {
    const data = cellEvent.node.data;
    delete data.original;
    copyToClipboard(JSON.stringify(data)).pipe(take(1)).subscribe();
  }

  executeMenuItem(item: GridContextMenuItemData) {
    item.action();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private getValue(cellEvent: CellContextMenuEvent) {
    const formatter = cellEvent.column.getUserProvidedColDef().valueFormatter;
    return formatter ? formatter(cellEvent) : cellEvent.value;
  }

  private setColumnsSize(data: string[]) {
    const updates = {visible: [], invisible: []};
    this.columnApi.getAllColumns().forEach((col, index) => {
      if (index === 0) {
        return;
      }

      const oldVisible = col.isVisible();
      const newVisible = data.includes(col.getColId());
      if (oldVisible !== newVisible) {
        updates[newVisible ? 'visible' : 'invisible'].push(col.getColId());
      }
    });

    Object.keys(updates).forEach((key) => {
      const cols = updates[key];
      if (cols.length) {
        this.columnApi.setColumnsVisible(cols, key === 'visible');
      }
    });

    timer().subscribe(() => this.columnApi.autoSizeColumns(updates.visible));
  }

  private updateSelected() {
    const selected = this.columnApi
      .getAllColumns()
      .filter((col) => col.isVisible())
      .map((col) => col.getColId());
    this.columnsControl.patchValue(selected);
  }

  private buildTree() {
    const columnsChildren = new Map<string, Set<string>>();
    const addChild = (parentId: string, childId: string) => {
      const children = columnsChildren.get(parentId) || new Set<string>();
      children.add(childId);
      columnsChildren.set(parentId, children);
    };

    const getTreeItems = (ids: Set<string>) => {
      const result = [];
      ids?.forEach((rootColId) => {
        const item = this.columnsById.get(rootColId);
        if (!item.name) {
          return;
        }

        result.push({
          ...item,
          children: getTreeItems(columnsChildren.get(rootColId)),
          showChildren: true,
        });
      });

      return result;
    };

    const registerColGroup = (group: OriginalColumnGroup) => {
      this.columnsById.set(group.getId(), {
        name: group.getColGroupDef().headerName,
        id: group.getId(),
      });
    };

    this.columnApi.getAllColumns().forEach((column) => {
      this.columnsById.set(column.getColId(), {
        name: column.getColDef().headerName,
        id: column.getColId(),
      });
      let parent = column.getOriginalParent();
      if (!parent?.getColGroupDef().headerName) {
        this.rootColumns.add(column.getColId());
        return;
      }

      addChild(parent.getId(), column.getColId());
      registerColGroup(parent);

      while (parent.getOriginalParent() && parent.getColGroupDef().headerName) {
        addChild(parent.getOriginalParent().getId(), parent.getId());
        parent = parent.getOriginalParent();
        registerColGroup(parent);
      }

      this.rootColumns.add(parent.getId());
    });

    this.columnsTree = getTreeItems(this.rootColumns);
  }

  private showCellContextMenu(cellEvent: CellContextMenuEvent) {
    (this.gridContextMenuService?.onCellMenuItems() || of([]))
      .pipe(
        take(1),
        tap((items) => (this.cellMenuItems = items.map((item) => item.data(cellEvent)))),
      )
      .subscribe(() => {
        this.copyJsonEnabled = !!cellEvent.node?.data?.$type;
        this.cdRef.detectChanges();
        this.contextMenuControlService.show(
          {
            contextMenu: this.cellMenu,
            event: cellEvent.event as MouseEvent,
            item: cellEvent,
          },
          'cell-menu',
        );
      });
  }
}
