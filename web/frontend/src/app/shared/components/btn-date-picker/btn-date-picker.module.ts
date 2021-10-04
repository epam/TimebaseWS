import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BtnDatePickerComponent } from './btn-date-picker.component';
import { BsDatepickerModule } from 'ngx-bootstrap';
import { SafeDatePickerModule } from '../../directives/safe-date-picker/safe-date-picker.module';



@NgModule({
  declarations: [
    BtnDatePickerComponent
  ],
  exports: [
    BtnDatePickerComponent
  ],
  imports: [
    CommonModule,
    BsDatepickerModule,
    SafeDatePickerModule
  ]
})
export class BtnDatePickerModule { }
