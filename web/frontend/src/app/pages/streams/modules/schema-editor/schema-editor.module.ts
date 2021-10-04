import { NgModule }                      from '@angular/core';
import { RouterModule }                  from '@angular/router';
import { EffectsModule }                 from '@ngrx/effects';
import { StoreModule }                   from '@ngrx/store';
import { AngularSplitModule }            from 'angular-split';
import { MonacoEditorModule }            from 'ngx-monaco-editor';
import { FileBtnModule }                 from '../../../../shared/components/file-btn/file-btn.module';
import { SplitterSizesModule }           from '../../../../shared/components/splitter-sizes/splitter-sizes.module';
import { SharedModule }                  from '../../../../shared/shared.module';
import { DynamicFormBuilderModule }      from '../../../../shared/utils/dynamic-form-builder/dynamic-form-builder.module';
import { CheckShowingOnCloseAlertGuard } from '../../services/guards/check.showing.onclose.alert.guard';
import { ClBottomPanelComponent }        from './components/cl-bottom-panel/cl-bottom-panel.component';
import { ClControlPanelComponent }       from './components/cl-control-panel/cl-control-panel.component';
import { ClassListGridComponent }        from './components/class-list-grid/class-list-grid.component';
import { GridComponent }                 from './components/diff/grid/grid.component';
import { LayoutComponent }               from './components/diff/layout/layout.component';
import { FieldPropertiesComponent }      from './components/field-properties/field-properties.component';
import { FieldsListComponent }           from './components/fields-list/fields-list.component';
import { FlControlPanelComponent }       from './components/fl-control-panel/fl-control-panel.component';
import { SchemaDownloadBtnComponent }    from './components/schema-download-btn/schema-download-btn.component';
import { SchemaUploadBtnComponent }      from './components/schema-upload-btn/schema-upload-btn.component';
import { SeLayoutComponent }             from './components/se-layout/se-layout.component';
import { SchemaEditorEffects }           from './store/schema-editor.effects';
import * as fromSchemaEditor             from './store/schema-editor.reducer';

@NgModule({
  declarations: [
    SeLayoutComponent,
    ClControlPanelComponent,
    FlControlPanelComponent,
    FieldPropertiesComponent,
    FieldsListComponent,
    ClassListGridComponent,
    LayoutComponent,
    GridComponent,
    SchemaDownloadBtnComponent,
    SchemaUploadBtnComponent,
    ClBottomPanelComponent,
  ],
  imports: [
    SharedModule,
    StoreModule.forFeature(fromSchemaEditor.schemaEditorFeatureKey, fromSchemaEditor.reducer),
    EffectsModule.forFeature([SchemaEditorEffects]),
    RouterModule.forChild([{
      path: '',
      component: SeLayoutComponent,
      canDeactivate: [CheckShowingOnCloseAlertGuard],
      data: {
        schemaEdit: true,
      },
    }]),
    AngularSplitModule,
    DynamicFormBuilderModule,
    MonacoEditorModule,
    FileBtnModule,
    SplitterSizesModule,
  ],
  exports: [
  ],
})
export class SchemaEditorModule {
}
