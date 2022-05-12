import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {SelectOptionDirective} from './select-option.directive';
import {SelectComponent} from './select.component';

@NgModule({
  declarations: [SelectComponent, SelectOptionDirective],
  exports: [SelectComponent, SelectOptionDirective],
  imports: [CommonModule, ReactiveFormsModule],
})
export class SelectModule {}
