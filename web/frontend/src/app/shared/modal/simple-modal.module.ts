import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from './modal.component';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap';
import { ModalHideBtnDirective } from './modal-hide-btn.directive';



@NgModule({
  declarations: [ModalComponent, ModalHideBtnDirective],
  exports: [
    ModalComponent,
    ModalHideBtnDirective,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    TooltipModule,
  ],
})
export class SimpleModalModule { }
