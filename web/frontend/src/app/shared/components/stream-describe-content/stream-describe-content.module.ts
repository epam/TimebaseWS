import { NgModule }                       from '@angular/core';
import { CommonModule }                   from '@angular/common';
import { TranslateModule }                from '@ngx-translate/core';
import { ButtonsModule }                  from 'ngx-bootstrap/buttons';
import { StreamDescribeContentComponent } from './stream-describe-content.component';
import { ReactiveFormsModule }            from '@angular/forms';



@NgModule({
  declarations: [
    StreamDescribeContentComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonsModule,
    TranslateModule,
  ],
  exports: [
    StreamDescribeContentComponent,
  ],
})
export class StreamDescribeContentModule { }
