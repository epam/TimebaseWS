import {ClipboardModule} from '@angular/cdk/clipboard';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {ErrorComponent} from './error.component';

@NgModule({
  declarations: [ErrorComponent],
  exports: [ErrorComponent],
  imports: [CommonModule, ClipboardModule, TranslateModule],
})
export class ErrorModule {}
