import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {QueryBtnComponent} from './query-btn.component';

@NgModule({
  declarations: [QueryBtnComponent],
  imports: [CommonModule, TooltipModule, TranslateModule, RouterModule],
  exports: [QueryBtnComponent],
})
export class QueryBtnModule {}
