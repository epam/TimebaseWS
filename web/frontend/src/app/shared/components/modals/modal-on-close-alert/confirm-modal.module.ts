import { NgModule } from '@angular/core';
import { ConfirmModalComponent } from './confirm-modal.component';
import { SimpleModalModule } from '../../../modal/simple-modal.module';
import { TooltipModule } from 'ngx-bootstrap';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [ConfirmModalComponent],
  exports: [
    ConfirmModalComponent,
  ],
  entryComponents: [
    ConfirmModalComponent,
  ],
  imports: [
    SimpleModalModule,
    TooltipModule,
    TranslateModule,
  ],
})
export class ConfirmModalModule { }
