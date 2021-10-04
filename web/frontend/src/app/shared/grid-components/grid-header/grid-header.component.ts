import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit, Optional,
  ViewChild,
} from '@angular/core';
import { IHeaderAngularComp }                             from 'ag-grid-angular';
import {
  BodyScrollEvent, Column,
  ColumnApi,
  IHeaderParams,
} from 'ag-grid-community';
import { ContextMenuComponent, ContextMenuService }       from 'ngx-contextmenu';
import { ContextMenuContentComponent }                            from 'ngx-contextmenu/lib/contextMenuContent.component';
import { fromEvent, merge, Observable, of, ReplaySubject, timer } from 'rxjs';
import { filter, mapTo, switchMap, take, takeUntil, tap }         from 'rxjs/operators';
import { GridContextMenuItemData }                        from '../grid-context-menu-item';
import { GridContextMenuService }                         from '../grid-context-menu.service';

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
  
  private columnsApi: ColumnApi;
  private colId: string;
  private column: Column;
  private subMenuContainer: ContextMenuContentComponent;
  private destroy$ = new ReplaySubject(1);
  
  constructor(
    private cdRef: ChangeDetectorRef,
    private context: ContextMenuService,
    @Optional() private gridContextMenuService: GridContextMenuService,
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
    fromEvent(params.api, 'bodyScroll').pipe(
      takeUntil(this.destroy$),
      filter((event: BodyScrollEvent) => event.direction === 'horizontal'),
    ).subscribe(() => this.context.closeAllContextMenus(null));
  }
  
  pin(position: string) {
    GridContextMenuService.viaContextMenu(() => this.columnsApi.setColumnPinned(this.colId, position));
    this.pinned = position;
  }
  
  autosize() {
    this.columnsApi.autoSizeColumn(this.colId);
  }
  
  autosizeAll() {
    this.columnsApi.autoSizeAllColumns();
  }
  
  onDropDownToggle(event: MouseEvent) {
    (this.gridContextMenuService?.onColumnMenuItems() || of([])).pipe(
      take(1),
      tap(items => this.columnMenuItems = items.map(item => item?.data({columnApi: this.columnsApi, column: this.column}))),
    ).subscribe(() => {
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
  
  private openColumnsMenu(event: MouseEvent) {
    this.dropdownOpen = true;
    this.context.show.next({
      contextMenu: this.contextMenuComponent,
      event: event,
      item: undefined,
    });
  
    this.context.show.pipe(
      tap(event => this.subMenuContainer = event.parentContextMenu),
      switchMap(() => {
        const el = document.querySelector('.grid-column-pin-submenu');
        return merge(
          fromEvent(el, 'mouseenter').pipe(mapTo(true)),
          fromEvent(el, 'mouseleave').pipe(mapTo(false)),
        ).pipe(takeUntil(this.context.show));
      }),
      takeUntil(this.context.close),
    ).subscribe(state => this.mouseOnContextMenu(state));
  
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
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
