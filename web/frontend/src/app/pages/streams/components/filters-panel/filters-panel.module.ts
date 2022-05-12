import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {SafeDatePickerModule} from '../../../../shared/directives/safe-date-picker/safe-date-picker.module';

import {FiltersPanelComponent} from './filters-panel.component';

@NgModule({
  declarations: [FiltersPanelComponent],
  exports: [FiltersPanelComponent, FiltersPanelComponent],
  imports: [CommonModule, TranslateModule, TooltipModule, SafeDatePickerModule, BsDatepickerModule],
})
export class FiltersPanelModule {}
