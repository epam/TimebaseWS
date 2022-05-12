import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TopGlobalMenuModule} from '../../shared/components/top-global-menu/top-global-menu.module';
import {LogoModule} from '../../shared/logo/logo.module';

import {DashboardRoutingModule} from './dashboard-routing.module';
import {DashboardComponent} from './dashboard.component';

@NgModule({
  declarations: [DashboardComponent],
  imports: [CommonModule, DashboardRoutingModule, TopGlobalMenuModule, LogoModule],
})
export class DashboardModule {}
