import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateRangePickerComponent } from './date-range-picker.component';
import { BtnDatePickerModule } from '../btn-date-picker/btn-date-picker.module';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    DateRangePickerComponent,
  ],
  exports: [
    DateRangePickerComponent,
  ],
  imports: [
    CommonModule,
    BtnDatePickerModule,
    ReactiveFormsModule,
  ],
})
export class DateRangePickerModule { }
