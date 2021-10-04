import { NgModule }             from '@angular/core';
import { CommonModule }         from '@angular/common';
import { NumbersOnlyDirective } from './numbers-only.directive';


@NgModule({
  declarations: [
    NumbersOnlyDirective,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    NumbersOnlyDirective,
  ],
})
export class NumbersOnlyModule {
}
