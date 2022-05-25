import { CommonModule }                     from '@angular/common';
import { NgModule }                         from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule }                  from '@ngx-translate/core';
import { AngularSplitModule }               from 'angular-split';
import { ButtonsModule }                    from 'ngx-bootstrap/buttons';
import { TooltipModule }                    from 'ngx-bootstrap/tooltip';
import { MonacoEditorModule }               from 'ngx-monaco-editor';
import { OrderBookModule }                  from '../../pages/order-book/order-book.module';
import { MessageInfoComponent }             from './message-info/message-info.component';
import { RightAreaComponent }               from './right-area/right-area.component';
import { RightToolbarComponent }            from './right-toolbar/right-toolbar.component';
import { StreamsPropsComponent }            from './streams-props/streams-props.component';

@NgModule({
  declarations: [
    RightToolbarComponent,
    RightAreaComponent,
    StreamsPropsComponent,
    MessageInfoComponent,
  ],
  exports: [RightToolbarComponent, RightAreaComponent, MessageInfoComponent],
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule,
    AngularSplitModule,
    ReactiveFormsModule,
    ButtonsModule,
    OrderBookModule,
    MonacoEditorModule,
    FormsModule,
  ],
})
export class RightPaneModule {}
