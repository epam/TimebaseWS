import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragProgressDirective } from './drag-progress.directive';



@NgModule({
  declarations: [
    DragProgressDirective,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    DragProgressDirective,
  ],
})
export class DragProgressModule { }
