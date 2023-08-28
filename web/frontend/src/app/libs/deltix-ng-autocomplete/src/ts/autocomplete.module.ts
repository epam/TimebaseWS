import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ClickOutsideModule} from '../../../../shared/directives/click-outside/click-outside.module';

import {AutocompleteComponent} from './components/autocomplete.component';
import {SafeHtmlPipe} from './pipes/safe-html.pipe';
import {ScrollingModule} from '@angular/cdk/scrolling';

@NgModule({
  imports: [FormsModule, CommonModule, ClickOutsideModule, ScrollingModule],
  exports: [AutocompleteComponent],
  declarations: [AutocompleteComponent, SafeHtmlPipe],
})
export class AutocompleteModule {}
