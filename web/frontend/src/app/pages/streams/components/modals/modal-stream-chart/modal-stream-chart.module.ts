import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {MultiSelectModule} from '../../../../../shared/components/multi-select/multi-select.module';
import {SelectModule} from '../../../../../shared/components/select/select.module';
import {ModalStreamChartComponent} from './modal-stream-chart.component';
import {SimpleModalModule} from '../../../../../shared/modal/simple-modal.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
    declarations: [ModalStreamChartComponent],
    imports: [
        CommonModule,
        SimpleModalModule,
        SelectModule,
        MultiSelectModule,
        ReactiveFormsModule,
        TranslateModule,
    ]
})
export class ModalStreamChartModule {}
