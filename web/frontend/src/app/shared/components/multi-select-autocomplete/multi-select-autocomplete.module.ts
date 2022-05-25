import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {MultiSelectAutocompleteComponent} from './multi-select-autocomplete.component';

@NgModule({
  declarations: [MultiSelectAutocompleteComponent],
  exports: [MultiSelectAutocompleteComponent],
  imports: [CommonModule, NgSelectModule, ReactiveFormsModule],
})
export class MultiSelectAutocompleteModule {}
