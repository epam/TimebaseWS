import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BtnDatePickerModule} from '../btn-date-picker/btn-date-picker.module';
import {DateRangePickerComponent} from './date-range-picker.component';

@NgModule({
  declarations: [DateRangePickerComponent],
  exports: [DateRangePickerComponent],
  imports: [CommonModule, BtnDatePickerModule, ReactiveFormsModule],
})
export class DateRangePickerModule {}
