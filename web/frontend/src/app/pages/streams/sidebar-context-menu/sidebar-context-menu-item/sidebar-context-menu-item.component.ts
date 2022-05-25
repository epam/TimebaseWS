import {Component, Input, OnInit} from '@angular/core';
import {ContextMenuService} from 'ngx-contextmenu';

@Component({
  selector: 'app-sidebar-context-menu-item',
  templateUrl: './sidebar-context-menu-item.component.html',
  styleUrls: ['./sidebar-context-menu-item.component.scss'],
})
export class SidebarContextMenuItemComponent implements OnInit {
  @Input() link: string[];
  @Input() queryParams: {[index: string]: string | string[]};
  @Input() tooltipTranslate: string;

  newTabQueryParams: {[index: string]: string};

  constructor(private contextMenuService: ContextMenuService) {}

  ngOnInit(): void {
    this.newTabQueryParams = {...this.queryParams, newTab: '1'};
  }

  closeContextMenu() {
    this.contextMenuService.closeAllContextMenus({eventType: 'cancel'});
  }
}
