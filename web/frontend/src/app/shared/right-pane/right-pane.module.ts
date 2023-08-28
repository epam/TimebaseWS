import { CommonModule }                     from '@angular/common';
import { NgModule }                         from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule }                  from '@ngx-translate/core';
import { AngularSplitModule }               from 'angular-split';
import { ButtonsModule }                    from 'ngx-bootstrap/buttons';
import { TooltipModule }                    from 'ngx-bootstrap/tooltip';
import { ColorPickerModule }                from 'ngx-color-picker';
import { MonacoEditorModule }               from 'ngx-monaco-editor';
import { OrderBookModule }                  from '../../pages/order-book/order-book.module';
import { MessageInfoComponent }             from './message-info/message-info.component';
import { RightAreaComponent }               from './right-area/right-area.component';
import { RightToolbarComponent }            from './right-toolbar/right-toolbar.component';
import { StreamsPropsComponent }            from './streams-props/streams-props.component';
import { ViewPropertiesComponent }          from './view-properties/view-properties.component';
import { RightInfoWrapperComponent }        from './right-info-wrapper/right-info-wrapper.component';
import { ChartSettingsComponent }           from './chart-settings/chart-settings.component';
import { StreamDescriptionComponent } from './stream-description/stream-description.component';
import { StreamDescribeContentModule } from '../components/stream-describe-content/stream-describe-content.module';
import { AutocompleteModule } from 'src/app/libs/deltix-ng-autocomplete/src/ts/autocomplete.module';

@NgModule({
  declarations: [
    RightToolbarComponent,
    RightAreaComponent,
    StreamsPropsComponent,
    MessageInfoComponent,
    ViewPropertiesComponent,
    RightInfoWrapperComponent,
    ChartSettingsComponent,
    StreamDescriptionComponent,
  ],
  exports: [RightToolbarComponent, RightAreaComponent, MessageInfoComponent, RightInfoWrapperComponent],
  imports: [
      AutocompleteModule ,
      CommonModule,
      TooltipModule,
      TranslateModule,
      AngularSplitModule,
      ReactiveFormsModule,
      ButtonsModule,
      OrderBookModule,
      MonacoEditorModule,
      FormsModule,
      ColorPickerModule,
      StreamDescribeContentModule,
  ],
})
export class RightPaneModule {}
