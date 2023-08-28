import {ChangeDetectorRef, Component, HostListener, Input} from '@angular/core';
import {take} from 'rxjs/operators';
import {MenuItem} from '../../../../shared/models/menu-item';
import {StreamsNavigationService} from '../../streams-navigation/streams-navigation.service';
import {SidebarContextMenuService} from '../sidebar-context-menu.service';

@Component({
  selector: 'app-menu-item-context-menu',
  templateUrl: './menu-item-context-menu.component.html',
  styleUrls: ['./menu-item-context-menu.component.scss'],
})
export class MenuItemContextMenuComponent {
  @Input() item: MenuItem;
  @Input() activeTabType: string;

  showMenu: boolean;

  constructor(
    private sidebarContextMenuService: SidebarContextMenuService,
    private cdRef: ChangeDetectorRef,
    private streamsNavigationService: StreamsNavigationService,
  ) {}

  @HostListener('contextmenu', ['$event']) onRightClick(event) {
    if (this.streamsNavigationService.url(this.item, this.activeTabType) === null) {
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
}
