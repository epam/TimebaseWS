var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Directive, ElementRef, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeHtmlPipe } from './../pipes/safe-html.pipe';
var AutocompleteDescriptionDirective = /** @class */ (function () {
    function AutocompleteDescriptionDirective(element, sanitizer) {
        this.element = element;
        this.sanitizer = sanitizer;
    }
    Object.defineProperty(AutocompleteDescriptionDirective.prototype, "safeHtml", {
        get: function () {
            if (this.safeHtmlPipe == null) {
                this.safeHtmlPipe = new SafeHtmlPipe(this.sanitizer);
            }
            return this.safeHtmlPipe;
        },
        enumerable: true,
        configurable: true
    });
    AutocompleteDescriptionDirective.prototype.ngOnChanges = function (changes) {
        if (changes['appAutocompleteDescription'] != null &&
            changes['appAutocompleteDescription'].currentValue !== changes['appAutocompleteDescription'].previousValue) {
            if (changes['appAutocompleteDescription'].currentValue instanceof HTMLElement) {
                this.element.nativeElement.innerHTML = '';
                this.element.nativeElement.appendChild(changes['appAutocompleteDescription'].currentValue);
            }
            else {
                this.element.nativeElement.innerHTML = this.safeHtml
                    .transform(changes['appAutocompleteDescription'].currentValue);
            }
        }
    };
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], AutocompleteDescriptionDirective.prototype, "appAutocompleteDescription", void 0);
    AutocompleteDescriptionDirective = __decorate([
        Directive({
            selector: '[appAutocompleteDescription]'
        }),
        __metadata("design:paramtypes", [ElementRef, DomSanitizer])
    ], AutocompleteDescriptionDirective);
    return AutocompleteDescriptionDirective;
}());
export { AutocompleteDescriptionDirective };
//# sourceMappingURL=autocomplete-description.directive.js.map