import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { AngularSplitModule } from 'angular-split';
import { DragProgressModule } from '../../shared/directives/drag-progress/drag-progress.module';

import { QueryComponent }             from './query.component';
import { AgGridModule }               from 'ag-grid-angular';
import { TranslateModule }            from '@ngx-translate/core';
import { ReactiveFormsModule }        from '@angular/forms';
import { AlertModule, TooltipModule } from 'ngx-bootstrap';
import { MonacoEditorModule }         from 'ngx-monaco-editor';
import { SharedModule }               from '../../shared/shared.module';
import { NumbersOnlyModule }          from '../../shared/directives/numbers-only/numbers-only.module';
import { StreamsSharedModule }        from '../streams/modules/streams-shared/streams-shared.module';


@NgModule({
  declarations: [QueryComponent],
  imports: [
    CommonModule,
    AgGridModule,
    TranslateModule,
    ReactiveFormsModule,
    TooltipModule,
    AlertModule,
    MonacoEditorModule,
    SharedModule,
    NumbersOnlyModule,
    AngularSplitModule,
    StreamsSharedModule,
    DragProgressModule,
  ],
})
export class QueryModule {
}
