import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {TopGlobalMenuComponent} from './top-global-menu.component';

@NgModule({
  declarations: [TopGlobalMenuComponent],
  exports: [TopGlobalMenuComponent],
  imports: [CommonModule, TooltipModule, TranslateModule, FormsModule],
})
export class TopGlobalMenuModule {}
