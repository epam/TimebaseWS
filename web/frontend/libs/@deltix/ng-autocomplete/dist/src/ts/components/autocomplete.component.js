var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ElementRef, EventEmitter, forwardRef, Input, Output, ViewChild, } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { AutocompleteBase } from './autocomplete-base';
// tslint:disable:max-line-length
var AutocompleteComponent = /** @class */ (function (_super) {
    __extends(AutocompleteComponent, _super);
    function AutocompleteComponent(element) {
        var _this = _super.call(this, element) || this;
        _this.highlight = true;
        _this.dropdown = false;
        _this.disabled = false;
        _this.required = false;
        _this.placeholder = '';
        _this.stripTags = true;
        _this.free = false;
        _this.spellcheck = true;
        _this.changeInput = new EventEmitter();
        _this.showDropdownChange = new EventEmitter();
        return _this;
    }
    AutocompleteComponent_1 = AutocompleteComponent;
    AutocompleteComponent.prototype.writeValue = function (obj) {
        this.selectedValue = obj;
        this.selectedText = this.getValueForItem(this.selectedValue);
    };
    AutocompleteComponent.prototype.onBlur = function (event) {
        if (this.free && !this.dropdown) {
            return;
        }
        this.selectedText = this.getValueForItem(this.selectedValue);
    };
    AutocompleteComponent.prototype.onKeyUp = function (event) {
        _super.prototype.onKeyUp.call(this, event);
        if (this.selectedText.length === 0 && this.required + '' !== 'true') {
            this.selectedValue = null;
            this.onChange(null);
        }
    };
    AutocompleteComponent.prototype.isSelected = function (value) {
        if (this.selectedValue === value) {
            return true;
        }
        else if (typeof this.valueGetter === 'function') {
            var selectedValueKey = this.valueGetter(this.selectedValue);
            var valueKey = this.valueGetter(value);
            return selectedValueKey === valueKey;
        }
    };
    AutocompleteComponent.prototype.select = function (item, event) {
        _super.prototype.select.call(this, item, event);
        event.stopPropagation();
        event.preventDefault();
        this.selectedText = this.getValueForItem(item);
        this.selectedValue = item;
        this.onChange(item);
        this.showDropdown = false;
    };
    AutocompleteComponent.prototype.onInput = function (event) {
        if (this.free && this.selectedValue != null && this.selectedText !== this.getValueForItem(this.selectedValue)) {
            this.selectedValue = null;
            this.onChange(this.selectedValue);
        }
        _super.prototype.onInput.call(this, event);
    };
    AutocompleteComponent.prototype.onInputClick = function (event) {
        if (!this.dropdown) {
            return;
        }
        this.showDropdown = !this.showDropdown;
    };
    AutocompleteComponent.prototype.onFocus = function (event) {
        if (this.dropdown) {
            return;
        }
        _super.prototype.onFocus.call(this, event);
    };
    var AutocompleteComponent_1;
    __decorate([
        Input(),
        __metadata("design:type", Array)
    ], AutocompleteComponent.prototype, "values", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], AutocompleteComponent.prototype, "highlight", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], AutocompleteComponent.prototype, "dropdown", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], AutocompleteComponent.prototype, "disabled", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], AutocompleteComponent.prototype, "required", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], AutocompleteComponent.prototype, "placeholder", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Function)
    ], AutocompleteComponent.prototype, "valueGetter", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Function)
    ], AutocompleteComponent.prototype, "descriptionGetter", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], AutocompleteComponent.prototype, "stripTags", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], AutocompleteComponent.prototype, "free", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Number)
    ], AutocompleteComponent.prototype, "maxlength", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], AutocompleteComponent.prototype, "spellcheck", void 0);
    __decorate([
        Input(),
        __metadata("design:type", String)
    ], AutocompleteComponent.prototype, "cssClass", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], AutocompleteComponent.prototype, "changeInput", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], AutocompleteComponent.prototype, "showDropdownChange", void 0);
    __decorate([
        ViewChild('dropdownContainer', { static: true }),
        __metadata("design:type", ElementRef)
    ], AutocompleteComponent.prototype, "dropdownContainer", void 0);
    AutocompleteComponent = AutocompleteComponent_1 = __decorate([
        Component({
            selector: 'deltix-ng-autocomplete',
            template: "\n        <div class=\"deltix-autocomplete\" [ngClass]=\"cssClass\">\n            <div class=\"autocomplete-container\" (mousedown)=\"onAutocompleteClick($event)\">\n                <input type=\"text\" class=\"autocomplete-input\" spellcheck=\"spellcheck\" [(ngModel)]=\"selectedText\" [title]=\"selectedText\" [disabled]=\"disabled\" [maxlength]=\"maxlength\" [placeholder]=\"placeholder\" (focus)=\"onFocus($event)\" (input)=\"onInput($event)\" (keyup)=\"onKeyUp($event)\" (blur)=\"onBlur($event)\" (click)=\"onInputClick($event)\">\n                <button *ngIf=\"dropdown && !disabled\" (click)=\"toggleDropdown($event)\" type=\"button\" class=\"autocomplete-caret-btn\"><i class=\"autocomplete-caret\"></i></button>\n                <div class=\"autocomplete-dropdown-container\" #dropdownContainer>\n                    <div class=\"autocomplete-dropdown\" *ngIf=\"!disabled\">\n                        <div class=\"autocomplete-dropdown-menu-wrapper\" *ngIf=\"isShowDropdown()\">\n                            <ul class=\"autocomplete-dropdown-menu\">\n                                <li *ngFor=\"let item of values\" class=\"autocomplete-dropdown-item\" [class.autocomplete-active]=\"isSelected(item)\" [title]=\"getTitleAttrValueForItem(item)\">\n                                    <a href=\"#\" (click)=\"select(item,$event)\" (keyup)=\"onElementKeyUp($event)\" [appAutocompleteDescription]=\"highlightTitle(item)\">\n                                    </a>\n                                </li>\n                                <ng-content></ng-content>\n                            </ul>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    ",
            providers: [{
                    provide: NG_VALUE_ACCESSOR,
                    multi: true,
                    useExisting: forwardRef(function () { return AutocompleteComponent_1; }),
                }]
        })
        // tslint:enable:max-line-length
        ,
        __metadata("design:paramtypes", [ElementRef])
    ], AutocompleteComponent);
    return AutocompleteComponent;
}(AutocompleteBase));
export { AutocompleteComponent };
//# sourceMappingURL=autocomplete.component.js.map