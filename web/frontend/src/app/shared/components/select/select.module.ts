import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectComponent } from './select.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SelectOptionDirective } from './select-option.directive';



@NgModule({
  declarations: [SelectComponent, SelectOptionDirective],
  exports: [
    SelectComponent,
    SelectOptionDirective
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class SelectModule { }
