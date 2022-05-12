import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ModalHideBtnDirective} from './modal-hide-btn.directive';
import {ModalComponent} from './modal.component';

@NgModule({
  declarations: [ModalComponent, ModalHideBtnDirective],
  exports: [ModalComponent, ModalHideBtnDirective],
  imports: [CommonModule, TranslateModule, TooltipModule],
})
export class SimpleModalModule {}
