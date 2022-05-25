var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutocompleteComponent } from './components/autocomplete.component';
import { ExtendedTextareaComponent } from './components/extended-textarea.component';
import { MultiAutocompleteComponent } from './components/multi-autocomplete.component';
import { AutocompleteDescriptionDirective } from './directives/autocomplete-description.directive';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
var AutocompleteModule = /** @class */ (function () {
    function AutocompleteModule() {
    }
    AutocompleteModule = __decorate([
        NgModule({
            imports: [
                FormsModule,
                CommonModule
            ],
            exports: [
                AutocompleteComponent,
                MultiAutocompleteComponent,
                ExtendedTextareaComponent
            ],
            declarations: [
                AutocompleteComponent,
                MultiAutocompleteComponent,
                ExtendedTextareaComponent,
                AutocompleteDescriptionDirective,
                SafeHtmlPipe
            ]
        })
    ], AutocompleteModule);
    return AutocompleteModule;
}());
export { AutocompleteModule };
//# sourceMappingURL=autocomplete.module.js.map