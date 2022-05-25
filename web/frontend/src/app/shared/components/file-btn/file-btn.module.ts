import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FileBtnComponent} from './file-btn.component';

@NgModule({
  declarations: [FileBtnComponent],
  exports: [FileBtnComponent],
  imports: [CommonModule],
})
export class FileBtnModule {}
