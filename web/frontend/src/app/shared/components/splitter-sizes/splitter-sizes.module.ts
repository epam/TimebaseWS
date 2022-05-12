import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {SplitterSizesDirective} from './splitter-sizes.directive';

@NgModule({
  declarations: [SplitterSizesDirective],
  imports: [CommonModule],
  exports: [SplitterSizesDirective],
})
export class SplitterSizesModule {}
