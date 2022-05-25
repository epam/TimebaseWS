import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ObjectMergePipe} from './object-merge.pipe';

@NgModule({
  declarations: [ObjectMergePipe],
  exports: [ObjectMergePipe],
  imports: [CommonModule],
})
export class PipesModule {}
