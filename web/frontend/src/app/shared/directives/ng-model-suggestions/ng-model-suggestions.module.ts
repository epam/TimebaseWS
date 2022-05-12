import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {NgModelSuggestionsDirective} from './ng-model-suggestions.directive';

@NgModule({
  declarations: [NgModelSuggestionsDirective],
  imports: [CommonModule],
  exports: [NgModelSuggestionsDirective],
})
export class NgModelSuggestionsModule {}
