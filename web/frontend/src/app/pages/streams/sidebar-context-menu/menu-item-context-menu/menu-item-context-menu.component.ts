import {ChangeDetectorRef, Component, HostListener, Input, OnDestroy, OnInit} from '@angular/core';
import {distinctUntilChanged, map, take, takeUntil} from 'rxjs/operators';
import {MenuItem} from '../../../../shared/models/menu-item';
import {StreamsNavigationService} from '../../streams-navigation/streams-navigation.service';
import {SidebarContextMenuService} from '../sidebar-context-menu.service';
import { GlobalFiltersService } from 'src/app/shared/services/global-filters.service';
import { BehaviorSubject, Subject } from 'rxjs';

@Component({
  selector: 'app-menu-item-context-menu',
  templateUrl: './menu-item-context-menu.component.html',
  styleUrls: ['./menu-item-context-menu.component.scss'],
})
export class MenuItemContextMenuComponent implements OnInit, OnDestroy {
  @Input() item: MenuItem;
  @Input() activeTabType: string;

  showMenu: boolean;
  reverseViewIsDefault$ = new BehaviorSubject(false);
  private destroy$ = new Subject<void>();

  constructor(
    private sidebarContextMenuService: SidebarContextMenuService,
    private cdRef: ChangeDetectorRef,
    private streamsNavigationService: StreamsNavigationService,
    private globalFiltersService: GlobalFiltersService
  ) {}

  @HostListener('contextmenu', ['$event']) onRightClick(event) {
    if (this.streamsNavigationService.url(this.item, this.activeTabType, this.reverseViewIsDefault$.getValue()) === null) {
      return;
    }

    if (this.showMenu) {
      this.sidebarContextMenuService.closeMenu();
      return;
    }

    this.showMenu = true;
    this.sidebarContextMenuService.openMenu(event, this.item);
    this.sidebarContextMenuService
      .onMenuWasClosed()
      .pipe(take(1))
      .subscribe(() => {
        this.showMenu = false;
        this.cdRef.markForCheck();
      });
  }

  ngOnInit(): void {
    this.globalFiltersService.getFilters().pipe(
      map((f) => f?.reverseViewIsDefault),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(reverseViewIsDefault => this.reverseViewIsDefault$.next(reverseViewIsDefault));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
