import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MultiselectNormalizeDirective} from './multiselect-normalize.directive';

@NgModule({
  declarations: [MultiselectNormalizeDirective],
  exports: [MultiselectNormalizeDirective],
  imports: [CommonModule],
})
export class MultiselectNormalizeModule {}
