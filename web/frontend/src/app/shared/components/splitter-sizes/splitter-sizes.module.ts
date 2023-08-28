import {CommonModule}                     from '@angular/common';
import {NgModule}                         from '@angular/core';
import { SplitterPixelsMinSizeDirective } from './splitter-pixels-min-size.directive';
import {SplitterSizesDirective}           from './splitter-sizes.directive';

@NgModule({
  declarations: [SplitterSizesDirective, SplitterPixelsMinSizeDirective],
  imports: [CommonModule],
  exports: [SplitterSizesDirective, SplitterPixelsMinSizeDirective],
})
export class SplitterSizesModule {}
