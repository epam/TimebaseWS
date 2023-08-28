import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {FileBtnComponent} from './file-btn.component';

@NgModule({
  declarations: [FileBtnComponent],
  exports: [FileBtnComponent],
  imports: [CommonModule, TranslateModule],
})
export class FileBtnModule {}
