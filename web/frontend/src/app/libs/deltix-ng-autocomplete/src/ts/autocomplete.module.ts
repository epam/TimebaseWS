import { CommonModule } from '@angular/common';
import { NgModule }     from '@angular/core';
import { FormsModule }  from '@angular/forms';

import { AutocompleteComponent }      from './components/autocomplete.component';
import { ExtendedTextareaComponent }  from './components/extended-textarea.component';
import { MultiAutocompleteComponent } from './components/multi-autocomplete.component';
import { SafeHtmlPipe }               from './pipes/safe-html.pipe';

@NgModule({
  imports: [
    FormsModule,
    CommonModule,
  ],
  exports: [
    AutocompleteComponent,
    MultiAutocompleteComponent,
    ExtendedTextareaComponent,
  ],
  declarations: [
    AutocompleteComponent,
    MultiAutocompleteComponent,
    ExtendedTextareaComponent,
    SafeHtmlPipe,
  ],
})
export class AutocompleteModule {

}
