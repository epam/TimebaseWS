import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {SafeDatePickerModule} from '../../directives/safe-date-picker/safe-date-picker.module';
import {BtnDatePickerComponent} from './btn-date-picker.component';

@NgModule({
  declarations: [BtnDatePickerComponent],
  exports: [BtnDatePickerComponent],
  imports: [CommonModule, BsDatepickerModule, SafeDatePickerModule],
})
export class BtnDatePickerModule {}
