import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SafeDatePickerValueDirective} from './safe-date-picker-value.directive';

@NgModule({
  declarations: [SafeDatePickerValueDirective],
  exports: [SafeDatePickerValueDirective],
  imports: [CommonModule],
})
export class SafeDatePickerModule {}
