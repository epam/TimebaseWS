import { NgModule }              from '@angular/core';
import { TooltipModule }         from 'ngx-bootstrap';
import { MonacoEditorModule }    from 'ngx-monaco-editor';
import { SharedModule }          from '../../../../shared/shared.module';
import { FiltersPanelComponent } from '../../components/filters-panel/filters-panel.component';
import { StreamsPropsComponent } from '../../components/streams-props/streams-props.component';
import { MessageInfoComponent }  from './components/message-info/message-info.component';
import { SafeDatePickerModule } from '../../../../shared/directives/safe-date-picker/safe-date-picker.module';
import {StreamRightToolbarModule} from "../../components/show-stream-details-btn/stream-right-toolbar.module";


@NgModule({
  declarations: [
    FiltersPanelComponent,
    StreamsPropsComponent,
    MessageInfoComponent,

  ],
    imports: [
        SharedModule,
        TooltipModule.forRoot(),
        MonacoEditorModule,
        SafeDatePickerModule,
        StreamRightToolbarModule,
    ],
  exports: [
    FiltersPanelComponent,
    StreamsPropsComponent,
    MessageInfoComponent,

    SharedModule,
    TooltipModule,
    MonacoEditorModule,
  ],
})
export class StreamsSharedModule {
}
