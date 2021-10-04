import { CommonModule }                      from '@angular/common';
import { NgModule }                          from '@angular/core';
import { FormsModule, ReactiveFormsModule }  from '@angular/forms';
import { TranslateModule }                   from '@ngx-translate/core';
import { AgGridModule }                      from 'ag-grid-angular';
import { NgMultiSelectDropDownModule }       from 'ng-multiselect-dropdown';
import { BsDatepickerModule, TooltipModule } from 'ngx-bootstrap';
import { NgxJsonViewerModule }               from 'ngx-json-viewer';

import { MonacoEditorModule }       from 'ngx-monaco-editor';
import { PerfectScrollbarModule }   from 'ngx-perfect-scrollbar';
import '../../ag-grid.license';
import { BtnDatePickerModule }      from './components/btn-date-picker/btn-date-picker.module';
import { TabsRouterProxyComponent } from './components/tabs-router-proxy/tabs-router-proxy.component';
import { TimeBarPickerComponent }   from './components/timebar-picker/time-bar-picker.component';

import { SafeDatePickerModule } from './directives/safe-date-picker/safe-date-picker.module';

@NgModule({
  declarations: [TimeBarPickerComponent, TabsRouterProxyComponent],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    AgGridModule,
    NgxJsonViewerModule,
    BsDatepickerModule.forRoot(),
    NgMultiSelectDropDownModule.forRoot(),
    TooltipModule.forRoot(),
    PerfectScrollbarModule,
    MonacoEditorModule,
    SafeDatePickerModule,
    BtnDatePickerModule,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AgGridModule,
    TranslateModule,
    NgxJsonViewerModule,
    BsDatepickerModule,
    NgMultiSelectDropDownModule,
    TimeBarPickerComponent,
    TooltipModule,
    PerfectScrollbarModule,
  ],

})
export class SharedModule {
}
