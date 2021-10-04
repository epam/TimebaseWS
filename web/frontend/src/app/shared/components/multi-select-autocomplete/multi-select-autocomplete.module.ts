import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiSelectAutocompleteComponent } from './multi-select-autocomplete.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    MultiSelectAutocompleteComponent
  ],
  exports: [
    MultiSelectAutocompleteComponent
  ],
  imports: [
    CommonModule,
    NgSelectModule,
    ReactiveFormsModule
  ]
})
export class MultiSelectAutocompleteModule { }
