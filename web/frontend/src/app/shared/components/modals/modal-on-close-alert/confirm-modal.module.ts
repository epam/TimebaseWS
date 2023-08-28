import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {SimpleModalModule} from '../../../modal/simple-modal.module';
import {ConfirmModalComponent} from './confirm-modal.component';

@NgModule({
    declarations: [ConfirmModalComponent],
    exports: [ConfirmModalComponent],
    imports: [SimpleModalModule, TooltipModule, TranslateModule, CommonModule]
})
export class ConfirmModalModule {}
