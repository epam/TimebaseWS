import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild,
}                                                   from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContextMenuComponent, ContextMenuService } from '@perfectmemory/ngx-contextmenu';
import { ContextMenuContentComponent }              from '@perfectmemory/ngx-contextmenu/lib/components/context-menu-content/context-menu-content.component';
import {IHeaderAngularComp}                                     from 'ag-grid-angular';
import {BodyScrollEvent, Column, ColumnApi, IHeaderParams}      from 'ag-grid-community';
import {fromEvent, merge, Observable, of, ReplaySubject, timer} from 'rxjs';
import {filter, mapTo, switchMap, take, takeUntil, tap, map}         from 'rxjs/operators';
import {ContextMenuControlService}                              from '../../services/context-menu-control.service';
import { GridEventsService } from '../../services/grid-events.service';
import {GridContextMenuItemData}                                from '../grid-context-menu-item';
import {GridContextMenuService}                                 from '../grid-context-menu.service';

@Component({
  selector: 'app-grid-header',
  templateUrl: './grid-header.component.html',
  styleUrls: ['./grid-header.component.scss'],
})
export class GridHeaderComponent implements OnInit, OnDestroy, IHeaderAngularComp {
  @ViewChild('contextMenu') private contextMenuComponent: ContextMenuComponent;
  
  displayName: string;
  pinned: string;
  columnMenuItems: GridContextMenuItemData[];
  disableColumns$: Observable<boolean>;
  dropdownOpen: boolean;
  closeSubMenu = false;
  mouseOnSubMenu = false;
  mouseOnPineItem = false;

  sortable = false;
  sorting: string = 'none';
 
  private columnsApi: ColumnApi;
  private colId: string;
  private column: Column;
  private subMenuContainer: ContextMenuContentComponent;
  private destroy$ = new ReplaySubject(1);
  
  @HostListener('contextmenu', ['$event']) onRightClick(event) {
    this.disableColumns$.pipe(take(1)).subscribe(disable => {
      if (!disable) {
        this.onDropDownToggle(event);
      }
    });
  }

  constructor(
    private cdRef: ChangeDetectorRef,
    private contextMenuControlService: ContextMenuControlService,
    private context: ContextMenuService,
    @Optional() private gridContextMenuService: GridContextMenuService,
    private activatedRoute: ActivatedRoute,
    private gridEventsService: GridEventsService
  ) {}

  ngOnInit(): void {
    this.disableColumns$ = this.gridContextMenuService?.onDisableColumns() || of(false);
  }

  agInit(params: IHeaderParams): void {
    this.columnsApi = params.columnApi;
    this.column = params.column;
    this.colId = params.column.getColId();
    this.displayName = params.displayName;
    this.pinned = params.column.getPinned();
    
    fromEvent(params.api, 'bodyScroll')
      .pipe(
        takeUntil(this.destroy$),
        filter((event: BodyScrollEvent) => event.direction === 'horizontal'),
      )
      .subscribe(() => {
        this.contextMenuControlService.closeMenu('cell-menu');
        this.contextMenuControlService.closeMenu('columns-menu');
      });

    if (['Symbol', 'Timestamp', 'Original Timestamp'].includes(this.displayName)
     && this.activatedRoute.snapshot.url.some(segment => segment.path === 'live')) {
      this.sortable = true;
    }

    this.gridEventsService.rowSortingOrder
      .pipe(map(sorting => Object.keys(sorting)[0]), takeUntil(this.destroy$))
      .subscribe(sortingColumn => {
        if (sortingColumn !== this.displayName.replace(' ', '-').toLowerCase()) {
          this.sorting = 'none';
        }
      });
  }

  pin(position: string) {
    GridContextMenuService.viaContextMenu(() =>
      this.columnsApi.setColumnPinned(this.colId, position),
    );
    this.pinned = position;
  }

  autosize() {
    this.columnsApi.autoSizeColumn(this.colId);
  }

  autosizeAll() {
    this.columnsApi.autoSizeAllColumns();
  }

  onDropDownToggle(event: MouseEvent) {
    (this.gridContextMenuService?.onColumnMenuItems() || of([]))
      .pipe(
        take(1),
        tap(
          (items) =>
            (this.columnMenuItems = items.map((item) =>
              item?.data({
                columnApi: this.columnsApi,
                column: this.column,
              }),
            )),
        ),
      )
      .subscribe(() => {
        this.cdRef.detectChanges();
        this.openColumnsMenu(event);
      });
  }

  mouseOnPinItem(state: boolean) {
    this.mouseOnPineItem = state;
    this.closePinSubMenu();
  }

  executeMenuItem(item: GridContextMenuItemData) {
    item.action();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private openColumnsMenu(event: MouseEvent) {
    this.dropdownOpen = true;
    this.contextMenuControlService.show(
      {
        contextMenu: this.contextMenuComponent,
        event: event,
        item: undefined,
      },
      'columns-menu',
    );

    this.context.show
      .pipe(
        tap((event) => (this.subMenuContainer = event.parentContextMenu)),
        switchMap(() => {
          const el = document.querySelector('.grid-column-pin-submenu');
          return merge(
            fromEvent(el, 'mouseenter').pipe(mapTo(true)),
            fromEvent(el, 'mouseleave').pipe(mapTo(false)),
          ).pipe(takeUntil(this.context.show));
        }),
        takeUntil(this.context.close),
      )
      .subscribe((state) => this.mouseOnContextMenu(state));

    this.context.close.pipe(take(1)).subscribe(() => {
      this.dropdownOpen = false;
      this.cdRef.detectChanges();
    });

    event.stopPropagation();
    event.stopImmediatePropagation();
    event.preventDefault();
  }

  private mouseOnContextMenu(state: boolean) {
    this.mouseOnSubMenu = state;
    this.closePinSubMenu();
  }

  private closePinSubMenu() {
    timer(300).subscribe(() => {
      if (!this.mouseOnSubMenu && !this.mouseOnPineItem) {
        this.context.destroySubMenus(this.subMenuContainer);
      }
    });
  }

  toggleSortingType() {
    this.sorting = ['none', 'descending'].includes(this.sorting) ? 'ascending' : 'descending';
    const key = this.displayName.replace(' ', '-').toLowerCase();
    this.gridEventsService.setRowSortingOrder({ [key]: this.sorting });
  }
}
