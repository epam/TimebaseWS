import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {AgGridModule} from 'ag-grid-angular';
import {AngularSplitModule} from 'angular-split';
import {AlertModule} from 'ngx-bootstrap/alert';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {SplitterSizesModule} from '../../shared/components/splitter-sizes/splitter-sizes.module';
import {NumbersOnlyModule} from '../../shared/directives/numbers-only/numbers-only.module';
import {LiveGridModule} from '../../shared/live-grid/live-grid.module';
import {RightPaneModule} from '../../shared/right-pane/right-pane.module';
import {SharedModule} from '../../shared/shared.module';

import {QueryComponent} from './query.component';

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
    SplitterSizesModule,
    BsDropdownModule,
    LiveGridModule,
    RightPaneModule,
  ],
})
export class QueryModule {}
