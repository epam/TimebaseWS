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
import { smartJoin, correctPasteString, smartSplit, smartLastIndexOf, smartIndexOf } from '../utils/utils';
import { AutocompleteBase } from './autocomplete-base';
// tslint:disable:max-line-length
var ExtendedTextareaComponent = /** @class */ (function (_super) {
    __extends(ExtendedTextareaComponent, _super);
    function ExtendedTextareaComponent(element) {
        var _this = _super.call(this, element) || this;
        _this.highlight = true;
        _this.disabled = false;
        _this.placeholder = '';
        _this.literal = '"';
        _this.stripTags = true;
        _this.allowSelectFirst = false;
        _this.spellcheck = true;
        _this.changeInput = new EventEmitter();
        _this.showDropdownChange = new EventEmitter();
        _this.separator = ' ';
        return _this;
    }
    ExtendedTextareaComponent_1 = ExtendedTextareaComponent;
    ExtendedTextareaComponent.prototype.writeValue = function (obj) {
        if (obj instanceof Array) {
            this.selectedValues = obj;
        }
        else {
            this.selectedValues = [obj];
        }
        this.selectedText = this.prepareInput(smartJoin(this.selectedValues, this.separator, this.literal));
    };
    ExtendedTextareaComponent.prototype.onBlur = function (event) {
        // this._selectedText = this.getValueForItems(this._selectedValues);
    };
    ExtendedTextareaComponent.prototype.onPaste = function (event) {
        event.preventDefault();
        event.returnValue = false;
        var clipboardData = event.clipboardData.getData('text/plain');
        this.selectedText = correctPasteString(clipboardData, this.separator, this.literal);
        this.changeInput.emit(this.selectedText);
    };
    ExtendedTextareaComponent.prototype.onKeyUp = function (event) {
        if (this.inputElement.selectionStart === this.inputElement.value.length) {
            _super.prototype.onKeyUp.call(this, event);
        }
        else {
            this.updateCursorPos();
            this.showDropdown = true;
        }
        this.selectedText = this.prepareInput(this.selectedText);
        if (this.inputElement.value !== this.selectedText) {
            this.inputElement.value = this.selectedText;
        }
        if (this.selectedText.length === 0) {
            this.selectedValues.length = 0;
            this.onChange([]);
        }
        else {
            this.onChange(smartSplit(this.selectedText, this.separator, this.literal));
        }
    };
    ExtendedTextareaComponent.prototype.select = function (item, event) {
        var _this = this;
        _super.prototype.select.call(this, item, event);
        event.stopPropagation();
        event.preventDefault();
        if (this.cursorPosition != null) {
            var pos_1 = this.getInputPos(this.cursorPosition);
            var v_1 = this.getValueForItem(item, this.separator, this.literal);
            this.selectedText = this.selectedText.substr(0, pos_1.left) + v_1 + this.selectedText.substr(pos_1.left + pos_1.length);
            setTimeout(function () {
                _this.inputElement.selectionStart = _this.inputElement.selectionEnd = pos_1.left + v_1.length;
            });
        }
        else {
            if (this.selectedValues.indexOf(item) >= 0) {
                return;
            }
            this.selectedValues.push(item);
        }
        this.onChange(smartSplit(this.selectedText, this.separator, this.literal));
        this.inputElement.focus();
        this.showDropdown = false;
        this.currentInput = null;
    };
    ExtendedTextareaComponent.prototype.onKeyDown = function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
    ExtendedTextareaComponent.prototype.onClick = function (event) {
        this.updateCursorPos();
        this.showDropdown = true;
    };
    ExtendedTextareaComponent.prototype.initInputElement = function () {
        if (this.inputElement == null) {
            this.inputElement = this.element.nativeElement.querySelector('textarea');
        }
    };
    ExtendedTextareaComponent.prototype.getTitleForItem = function (item) {
        var _this = this;
        if (item != null && typeof this.descriptionGetter === 'function') {
            return this.descriptionGetter.call(null, item, function (str) {
                if (_this.isTrue(_this.highlight)) {
                    if (_this.currentInput == null || _this.currentInput.length === 0) {
                        return str;
                    }
                    var selectedText = smartSplit(_this.currentInput, _this.separator, _this.literal);
                    for (var i = 0; i < selectedText.length; i++) {
                        str = _this.highlightText(str, selectedText[i]);
                    }
                }
                return str;
            });
        }
        return this.getValueForItem(item);
    };
    ExtendedTextareaComponent.prototype.onInput = function (event) {
        this.updateCursorPos();
        if (!this.showDropdown) {
            this.showDropdown = true;
        }
    };
    ExtendedTextareaComponent.prototype.updateCursorPos = function () {
        this.cursorPosition = this.inputElement.selectionStart;
        var pos = this.getInputPos(this.cursorPosition);
        this.currentInput = this.inputElement.value.substr(pos.left, pos.length);
        this.inputEmit(this.prepareInput(this.currentInput));
    };
    ExtendedTextareaComponent.prototype.getInputPos = function (cursorPos) {
        var offsetLeft = smartLastIndexOf(this.inputElement.value.substring(0, cursorPos), this.separator, this.literal);
        if (offsetLeft === -1) {
            offsetLeft = 0;
        }
        else {
            offsetLeft++;
        }
        var t = this.inputElement.value.substring(cursorPos);
        var offsetRight = smartIndexOf(t, this.separator, this.literal);
        if (offsetRight === -1) {
            offsetRight = t.length;
        }
        return { left: offsetLeft, length: cursorPos - offsetLeft + offsetRight };
    };
    ExtendedTextareaComponent.prototype.hasInput = function () {
        return this.currentInput != null && this.currentInput.trim().length !== 0;
    };
    ExtendedTextareaComponent.prototype.onFocus = function (event) {
        _super.prototype.onFocus.call(this, event);
        this.cursorPosition = null;
    };
    ExtendedTextareaComponent.prototype.prepareInput = function (str) {
        return str.replace(/\r?\n|\r/g, this.separator);
    };
    var ExtendedTextareaComponent_1;
    __decorate([
        Input(),
        __metadata("design:type", Array)
    ], ExtendedTextareaComponent.prototype, "values", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], ExtendedTextareaComponent.prototype, "highlight", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], ExtendedTextareaComponent.prototype, "disabled", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], ExtendedTextareaComponent.prototype, "placeholder", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], ExtendedTextareaComponent.prototype, "literal", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Function)
    ], ExtendedTextareaComponent.prototype, "descriptionGetter", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], ExtendedTextareaComponent.prototype, "stripTags", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], ExtendedTextareaComponent.prototype, "allowSelectFirst", void 0);
    __decorate([
        Input(),
        __metadata("design:type", String)
    ], ExtendedTextareaComponent.prototype, "cssClass", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], ExtendedTextareaComponent.prototype, "spellcheck", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], ExtendedTextareaComponent.prototype, "changeInput", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], ExtendedTextareaComponent.prototype, "showDropdownChange", void 0);
    __decorate([
        ViewChild('dropdownContainer', { static: true }),
        __metadata("design:type", ElementRef)
    ], ExtendedTextareaComponent.prototype, "dropdownContainer", void 0);
    ExtendedTextareaComponent = ExtendedTextareaComponent_1 = __decorate([
        Component({
            selector: 'deltix-ng-extended-textarea',
            template: "\n        <div class=\"deltix-autocomplete\" [ngClass]=\"cssClass\">\n            <div class=\"autocomplete-container\" (mousedown)=\"onAutocompleteClick($event)\">\n                <textarea type=\"text\" spellcheck=\"spellcheck\" [(ngModel)]=\"selectedText\" [title]=\"selectedText\" (focus)=\"onFocus($event)\" (paste)=\"onPaste($event)\" (input)=\"onInput($event)\" (keyup)=\"onKeyUp($event)\" (keydown)=\"onKeyDown($event)\" (click)=\"onClick($event)\" (blur)=\"onBlur($event)\" [disabled]=\"disabled\" class=\"autocomplete-input\" [placeholder]=\"placeholder\"></textarea>\n                <button *ngIf=\"!disabled\" (click)=\"toggleDropdown($event)\" type=\"button\" class=\"autocomplete-caret-btn\"><i class=\"autocomplete-caret\"></i></button>\n                <div class=\"autocomplete-dropdown-container\" #dropdownContainer>\n                    <div class=\"autocomplete-dropdown\" *ngIf=\"!disabled\">\n                        <div class=\"autocomplete-dropdown-menu-wrapper\" *ngIf=\"isShowDropdown()\">\n                            <ul class=\"autocomplete-dropdown-menu\">\n                                <li *ngFor=\"let item of values; first as isFirst\" class=\"autocomplete-dropdown-item\" [title]=\"getTitleAttrValueForItem(item)\">\n                                    <a href=\"#\" (click)=\"select(item,$event)\" (keyup)=\"onElementKeyUp($event)\" [appAutocompleteDescription]=\"highlightTitle(item)\" [ngClass]=\"{'active':isFirst && allowSelectFirst && hasInput()}\"></a>\n                                </li>\n                            </ul>\n                            <ng-content></ng-content>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    ",
            providers: [{
                    provide: NG_VALUE_ACCESSOR,
                    multi: true,
                    useExisting: forwardRef(function () { return ExtendedTextareaComponent_1; }),
                }]
        })
        // tslint:enable:max-line-length
        ,
        __metadata("design:paramtypes", [ElementRef])
    ], ExtendedTextareaComponent);
    return ExtendedTextareaComponent;
}(AutocompleteBase));
export { ExtendedTextareaComponent };
//# sourceMappingURL=extended-textarea.component.js.map