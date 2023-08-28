import { NgModule }            from '@angular/core';
import { CommonModule }        from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { QqlEditorComponent }  from './qql-editor.component';
import { MonacoEditorModule }  from 'ngx-monaco-editor';
import { TranslateModule } from '@ngx-translate/core';



@NgModule({
  declarations: [
    QqlEditorComponent,
  ],
  exports: [
    QqlEditorComponent,
  ],
    imports: [
        CommonModule,
        MonacoEditorModule,
        ReactiveFormsModule,
        TranslateModule,
    ],
})
export class QqlEditorModule { }
