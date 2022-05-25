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
import { ExtendedTextareaComponent } from './extended-textarea.component';
// tslint:disable:max-line-length
var MultiAutocompleteComponent = /** @class */ (function (_super) {
    __extends(MultiAutocompleteComponent, _super);
    function MultiAutocompleteComponent(element) {
        var _this = _super.call(this, element) || this;
        _this.element = element;
        _this.highlight = true;
        _this.disabled = false;
        _this.placeholder = '';
        _this.stripTags = true;
        _this.allowSelectFirst = false;
        _this.dropdown = false;
        _this.miniFilter = false;
        _this.spellcheck = true;
        _this.changeInput = new EventEmitter();
        _this.showDropdownChange = new EventEmitter();
        _this.miniFilterText = '';
        return _this;
    }
    MultiAutocompleteComponent_1 = MultiAutocompleteComponent;
    MultiAutocompleteComponent.prototype.writeValue = function (obj) {
        if (obj instanceof Array) {
            this.selectedValues = obj;
        }
        else {
            this.selectedValues = [obj];
        }
        this.selectedText = this.prepareInput(this.getValueForItems(this.selectedValues));
    };
    MultiAutocompleteComponent.prototype.onKeyUp = function (event) {
        if (event.keyCode === 27) {
            this.showDropdown = false;
            return;
        }
        if (this.inputElement.selectionStart === this.inputElement.value.length) {
            if (event.keyCode === 40) { // down
                var el = this.dropdownContainer.nativeElement;
                var items = el.querySelectorAll('.autocomplete-dropdown-item');
                if (items.length > 0) {
                    var first = items.item(0).firstElementChild;
                    first.focus();
                }
                return;
            }
        }
        else {
            this.updateCursorPos();
            this.showDropdown = true;
        }
        if (this.selectedText.length === 0) {
            this.selectedValues.length = 0;
            this.onChange([]);
        }
    };
    MultiAutocompleteComponent.prototype.select = function (item, event) {
        var _this = this;
        event.stopPropagation();
        event.preventDefault();
        if (this.isTrue(this.dropdown)) {
            var pos = this.selectedValues.indexOf(item);
            if (pos === -1) {
                this.selectedValues.push(item);
            }
            else {
                this.selectedValues.splice(pos, 1);
            }
        }
        else {
            if (this.cursorPosition != null) {
                var pos_1 = this.getInputPos(this.cursorPosition);
                var v_1 = this.getValueForItem(item);
                this.selectedText = this.selectedText.substr(0, pos_1.left) + v_1 + this.selectedText.substr(pos_1.left + pos_1.length);
                setTimeout(function () {
                    _this.inputElement.selectionStart = _this.inputElement.selectionEnd = pos_1.left + v_1.length;
                });
                this.updateItemsFromInput();
            }
            else {
                if (this.selectedValues.indexOf(item) >= 0) {
                    return;
                }
                this.selectedValues.push(item);
            }
        }
        this.selectedText = this.prepareInput(this.getValueForItems(this.selectedValues));
        this.onChange(this.selectedValues.slice());
        if (!this.miniFilter) {
            this.inputElement.focus();
            this.showDropdown = false;
        }
        this.currentInput = null;
    };
    MultiAutocompleteComponent.prototype.isSelected = function (value) {
        return this.selectedValues.indexOf(value) >= 0;
    };
    MultiAutocompleteComponent.prototype.getValueForItems = function (items) {
        var str = '';
        for (var i = 0; i < items.length; i++) {
            str += this.getValueForItem(items[i]);
            if (i + 1 !== items.length) {
                str += this.separator;
            }
        }
        return str;
    };
    MultiAutocompleteComponent.prototype.getTitleForItem = function (item) {
        var _this = this;
        if (item != null && typeof this.descriptionGetter === 'function') {
            return this.descriptionGetter.call(null, item, function (str) {
                var selectedText = (_this.hasInput() ? _this.currentInput : _this.selectedText).split(_this.separator);
                for (var i = 0; i < selectedText.length; i++) {
                    str = _this.highlightText(str, selectedText[i]);
                }
                return str;
            });
        }
        return this.getValueForItem(item);
    };
    MultiAutocompleteComponent.prototype.onInput = function (event) {
        this.updateItemsFromInput();
        this.updateCursorPos();
        if (!this.showDropdown) {
            this.showDropdown = true;
        }
    };
    MultiAutocompleteComponent.prototype.updateItemsFromInput = function () {
        var str = this.selectedText.split(this.separator);
        var values = this.values.slice();
        values.push.apply(values, this.selectedValues);
        this.selectedValues.length = 0;
        for (var i = 0; i < values.length; i++) {
            var index = str.indexOf(this.getValueForItem(values[i]));
            if (index >= 0) {
                this.selectedValues[index] = values[i];
            }
        }
        for (var i = 0; i < this.selectedValues.length; i++) {
            if (typeof (this.selectedValues[i]) === 'undefined') {
                this.selectedValues.splice(i, 1);
            }
        }
        this.onChange(this.selectedValues.slice());
    };
    MultiAutocompleteComponent.prototype.onDocumentClickCallback = function () {
        this.selectedText = this.getValueForItems(this.selectedValues);
    };
    MultiAutocompleteComponent.prototype.prepareInput = function (str) {
        var newStr = str.replace(/\r?\n|\r/g, '');
        if (newStr !== str) {
            return ' ' + newStr;
        }
        return newStr;
    };
    MultiAutocompleteComponent.prototype.onMiniFilterClick = function (event) {
        event.stopPropagation();
        event.preventDefault();
    };
    MultiAutocompleteComponent.prototype.inputEmit = function (str) {
        if (this.miniFilter) {
            return;
        }
        this.changeInput.emit(str);
    };
    Object.defineProperty(MultiAutocompleteComponent.prototype, "valuesForRender", {
        get: function () {
            var _this = this;
            if (!this.miniFilter && this.miniFilterText.length === 0 && this.miniFilterText.trim().length === 0) {
                return this.values;
            }
            var filter = this.miniFilterText.trim().toLowerCase();
            return this.values.filter((function (i) {
                var value = _this.getValueForItem(i);
                return value.toLowerCase().lastIndexOf(filter) !== -1;
            }));
        },
        enumerable: true,
        configurable: true
    });
    MultiAutocompleteComponent.prototype.setShowDropdown = function (value) {
        var _this = this;
        if (value && this.miniFilter && this.dropdown) {
            setTimeout(function () {
                if (_this.miniFilterElementRef == null) {
                    return;
                }
                var element = _this.miniFilterElementRef.nativeElement;
                if (element != null) {
                    element.focus();
                }
            });
        }
        _super.prototype.setShowDropdown.call(this, value);
    };
    var MultiAutocompleteComponent_1;
    __decorate([
        Input(),
        __metadata("design:type", Array)
    ], MultiAutocompleteComponent.prototype, "values", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], MultiAutocompleteComponent.prototype, "highlight", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], MultiAutocompleteComponent.prototype, "disabled", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], MultiAutocompleteComponent.prototype, "placeholder", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Function)
    ], MultiAutocompleteComponent.prototype, "valueGetter", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Function)
    ], MultiAutocompleteComponent.prototype, "descriptionGetter", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], MultiAutocompleteComponent.prototype, "stripTags", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], MultiAutocompleteComponent.prototype, "allowSelectFirst", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], MultiAutocompleteComponent.prototype, "dropdown", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], MultiAutocompleteComponent.prototype, "miniFilter", void 0);
    __decorate([
        Input(),
        __metadata("design:type", String)
    ], MultiAutocompleteComponent.prototype, "cssClass", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], MultiAutocompleteComponent.prototype, "spellcheck", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], MultiAutocompleteComponent.prototype, "changeInput", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], MultiAutocompleteComponent.prototype, "showDropdownChange", void 0);
    __decorate([
        ViewChild('dropdownContainer', { static: true }),
        __metadata("design:type", ElementRef)
    ], MultiAutocompleteComponent.prototype, "dropdownContainer", void 0);
    __decorate([
        ViewChild('miniFilter', { static: true }),
        __metadata("design:type", ElementRef)
    ], MultiAutocompleteComponent.prototype, "miniFilterElementRef", void 0);
    MultiAutocompleteComponent = MultiAutocompleteComponent_1 = __decorate([
        Component({
            selector: 'deltix-ng-multi-autocomplete',
            template: "\n        <div class=\"deltix-autocomplete\" [ngClass]=\"cssClass\">\n            <div class=\"autocomplete-container\" (mousedown)=\"onAutocompleteClick($event)\">\n                <textarea type=\"text\" spellcheck=\"spellcheck\" [(ngModel)]=\"selectedText\" [title]=\"selectedText\" (focus)=\"onFocus($event)\" (input)=\"onInput($event)\" (keyup)=\"onKeyUp($event)\" (keydown)=\"onKeyDown($event)\" (click)=\"onClick($event)\" (blur)=\"onBlur($event)\" [disabled]=\"disabled\" class=\"autocomplete-input\" [placeholder]=\"placeholder\"></textarea>\n                <button *ngIf=\"!disabled\" (click)=\"toggleDropdown($event)\" type=\"button\" class=\"autocomplete-caret-btn\"><i class=\"autocomplete-caret\"></i></button>\n                <div class=\"autocomplete-dropdown-container\" #dropdownContainer>\n                    <div class=\"autocomplete-dropdown\" *ngIf=\"!disabled\">\n                        <div class=\"autocomplete-dropdown-menu-wrapper\" *ngIf=\"isShowDropdown()\">\n                            <div class=\"autocomplete-mini-filter\" *ngIf=\"miniFilter\">\n                                <input type=\"text\" #miniFilter class=\"autocomplete-input\" (click)=\"onMiniFilterClick($event)\" [(ngModel)]=\"miniFilterText\" placeholder=\"Search...\" />\n                            </div>\n                            <ul class=\"autocomplete-dropdown-menu\">\n                                <li *ngFor=\"let item of valuesForRender; first as isFirst\" class=\"autocomplete-dropdown-item\" [class.autocomplete-active]=\"isSelected(item)\" [title]=\"getTitleAttrValueForItem(item)\">\n                                    <a href=\"#\" (click)=\"select(item,$event)\" (keyup)=\"onElementKeyUp($event)\" [appAutocompleteDescription]=\"highlightTitle(item)\" [ngClass]=\"{'active':isFirst && allowSelectFirst && hasInput()}\"></a>\n                                </li>\n                            </ul>\n                            <ng-content></ng-content>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    ",
            providers: [{
                    provide: NG_VALUE_ACCESSOR,
                    multi: true,
                    useExisting: forwardRef(function () { return MultiAutocompleteComponent_1; }),
                }]
        })
        // tslint:enable:max-line-length
        ,
        __metadata("design:paramtypes", [ElementRef])
    ], MultiAutocompleteComponent);
    return MultiAutocompleteComponent;
}(ExtendedTextareaComponent));
export { MultiAutocompleteComponent };
//# sourceMappingURL=multi-autocomplete.component.js.map