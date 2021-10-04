import { NgModule }                      from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { TranslateModule }               from '@ngx-translate/core';
import { TooltipModule }               from 'ngx-bootstrap';
import { StreamRightToolbarComponent } from './stream-right-toolbar.component';


@NgModule({
  declarations: [
    StreamRightToolbarComponent,
  ],
  exports: [
    StreamRightToolbarComponent,
  ],
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule,
  ],
})
export class StreamRightToolbarModule { }
