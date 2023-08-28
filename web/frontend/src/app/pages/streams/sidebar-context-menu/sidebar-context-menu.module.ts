import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ContextMenuModule} from '@perfectmemory/ngx-contextmenu';
import {ConfirmModalModule} from '../../../shared/components/modals/modal-on-close-alert/confirm-modal.module';
import {PipesModule} from '../../../shared/pipes/pipes.module';
import {ModalStreamChartModule} from '../components/modals/modal-stream-chart/modal-stream-chart.module';
import {QueryBtnModule} from '../components/query-btn/query-btn.module';
import {StreamsNavigationModule} from '../streams-navigation/streams-navigation.module';
import {MenuItemContextMenuComponent} from './menu-item-context-menu/menu-item-context-menu.component';
import {SidebarContextMenuItemComponent} from './sidebar-context-menu-item/sidebar-context-menu-item.component';
import {SidebarContextMenuService} from './sidebar-context-menu.service';
import {SidebarContextMenuComponent} from './sidebar-context-menu/sidebar-context-menu.component';

@NgModule({
  declarations: [
    MenuItemContextMenuComponent,
    SidebarContextMenuComponent,
    SidebarContextMenuItemComponent,
  ],
  exports: [MenuItemContextMenuComponent, SidebarContextMenuComponent],
  imports: [
    CommonModule,
    ContextMenuModule,
    TranslateModule,
    RouterModule,
    TooltipModule,
    QueryBtnModule,
    ConfirmModalModule,
    StreamsNavigationModule,
    PipesModule,
    ModalStreamChartModule,
  ],
  providers: [SidebarContextMenuService],
})
export class SidebarContextMenuModule {}
