import {CommonModule}                     from '@angular/common';
import {NgModule}                         from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { GenerateDDLComponent } from './generate-ddl.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

@NgModule({
  declarations: [GenerateDDLComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgMultiSelectDropDownModule
  ],
  exports: [GenerateDDLComponent],
})
export class GenerateDDLModule {}