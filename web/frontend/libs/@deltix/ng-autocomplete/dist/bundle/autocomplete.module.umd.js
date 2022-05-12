(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/common'), require('@angular/forms'), require('@angular/core'), require('@angular/platform-browser')) :
    typeof define === 'function' && define.amd ? define(['exports', '@angular/common', '@angular/forms', '@angular/core', '@angular/platform-browser'], factory) :
    (factory((global['deltix-ng-autocomplete'] = {}),global.common,global.forms,global.ng.core,global.platformBrowser));
}(this, (function (exports,common,forms,core,platformBrowser) { 'use strict';

    var AutocompleteBase = /** @class */ (function () {
        function AutocompleteBase(element) {
            var _this = this;
            this.element = element;
            this.skipDocumentClick = false;
            this.onChange = Function.prototype;
            this.onTouched = Function.prototype;
            this.stripTags = true;
            this.tempDiv = document.createElement('DIV');
            this.decryptionCache = {};
            this._showDropdown = false;
            this.selectedText = '';
            this.dropdownOuterContainer = document.createElement('div');
            this.dropdownOuterContainer.classList.add('deltix-autocomplete', 'autocomplete-outer-container');
            document.body.appendChild(this.dropdownOuterContainer);
            this.onDocumentEvent = function () {
                _this.updateDropdownPosition();
            };
            document.addEventListener('scroll', this.onDocumentEvent, true);
            document.addEventListener('resize', this.onDocumentEvent, true);
        }
        Object.defineProperty(AutocompleteBase.prototype, "showDropdown", {
            get: function () {
                return this._showDropdown;
            },
            set: function (value) {
                this.setShowDropdown(value);
            },
            enumerable: true,
            configurable: true
        });
        AutocompleteBase.prototype.setShowDropdown = function (value) {
            if (this._showDropdown === value) {
                return;
            }
            this._showDropdown = value;
            if (this.showDropdownChange != null) {
                this.showDropdownChange.emit(this._showDropdown);
            }
        };
        AutocompleteBase.prototype.onElementKeyUp = function (event) {
            if (event.keyCode === 40) { // down
                var next = event.target.parentElement.nextElementSibling;
                if (next != null && next['tagName'] === 'LI') {
                    var a = next.firstElementChild;
                    a.focus();
                }
            }
            else if (event.keyCode === 38) { // up
                var prev = event.target.parentElement.previousElementSibling;
                if (prev != null && prev['tagName'] === 'LI') {
                    var a = prev.firstElementChild;
                    a.focus();
                }
                else {
                    this.inputElement.focus();
                }
            }
        };
        AutocompleteBase.prototype.onAutocompleteClick = function (event) {
            this.skipDocumentClick = true;
        };
        AutocompleteBase.prototype.onInput = function (event) {
            var element = event.target;
            this.inputEmit(element.value);
        };
        AutocompleteBase.prototype.inputEmit = function (str) {
            this.changeInput.emit(str);
        };
        AutocompleteBase.prototype.onFocus = function (event) {
            this.showDropdown = true;
        };
        AutocompleteBase.prototype.toggleDropdown = function (event) {
            this.showDropdown = !this.showDropdown;
            if (!this.showDropdown) {
                this.decryptionCache = {};
            }
        };
        AutocompleteBase.prototype.highlightTitle = function (item) {
            var description = this.getTitleForItem(item);
            if (this.isTrue(this.stripTags)) {
                description = this.stripTagsFromString(description instanceof HTMLElement ? description.innerHTML : description);
                if (this.isTrue(this.highlight)) {
                    return this.highlightText(description, this.selectedText);
                }
            }
            return description;
        };
        AutocompleteBase.prototype.escapeRegExp = function (str) {
            return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        };
        AutocompleteBase.prototype.highlightText = function (text, highlightStr) {
            if (!highlightStr) {
                return text;
            }
            var regexp = new RegExp("(" + this.escapeRegExp(highlightStr) + ")", 'im');
            return text.replace(regexp, '<span>$1</span>');
        };
        AutocompleteBase.prototype.getValueForItem = function (item, separator, literal) {
            if (typeof this.valueGetter === 'function') {
                return this.valueGetter.call(null, item);
            }
            if (item == null) {
                return '';
            }
            if (typeof item === 'string') {
                if (item.includes(separator)) {
                    return "" + literal + item + literal;
                }
                return item;
            }
            if (typeof item === 'number') {
                return item + '';
            }
            return '[object]';
        };
        AutocompleteBase.prototype.getTitleForItem = function (item) {
            var _this = this;
            var value = this.getValueForItem(item);
            if (this.decryptionCache.hasOwnProperty(value)) {
                return this.decryptionCache[value];
            }
            if (item != null && typeof this.descriptionGetter === 'function') {
                return this.decryptionCache[value] =
                    this.descriptionGetter.call(null, item, function (str) { return _this.highlightText(str, _this.selectedText); });
            }
            return value;
        };
        AutocompleteBase.prototype.stripTagsFromString = function (str) {
            var tmp = this.tempDiv;
            tmp.innerHTML = str;
            return tmp.textContent || tmp.innerText || '';
        };
        AutocompleteBase.prototype.initInputElement = function () {
            if (this.inputElement == null) {
                this.inputElement = this.element.nativeElement.querySelector('input');
            }
        };
        AutocompleteBase.prototype.onDocumentClickCallback = function () {
            // empty method
        };
        AutocompleteBase.prototype.isFalse = function (value) {
            if (typeof value === 'string') {
                return value === 'false';
            }
            return !value;
        };
        AutocompleteBase.prototype.isTrue = function (value) {
            if (typeof value === 'string') {
                return value === 'true';
            }
            return value;
        };
        AutocompleteBase.prototype.isShowDropdown = function () {
            return this.showDropdown && this.values.length > 0;
        };
        AutocompleteBase.prototype.updateDropdownPosition = function () {
            var div = this.element.nativeElement;
            var rect = div.getBoundingClientRect();
            var dropdown = this.dropdownContainer.nativeElement;
            var dropdownRect = dropdown.getBoundingClientRect();
            var offset = rect.top + rect.height;
            var fullHeight = false;
            if (window.innerHeight < offset + dropdownRect.height || offset < 0) {
                if (rect.top - dropdownRect.height < 0) {
                    dropdown.style.top = '0px';
                    if (dropdownRect.height >= window.innerHeight) {
                        fullHeight = true;
                        dropdown.style.maxHeight = dropdownRect.height + 'px';
                    }
                }
                else {
                    dropdown.style.top = (rect.top - dropdownRect.height) + 'px';
                }
            }
            else {
                dropdown.style.top = offset + 'px';
            }
            dropdown.style.width = rect.width + 'px';
            dropdown.style.left = rect.left + 'px';
            if (fullHeight) {
                dropdown.classList.add('autocomplete-full-height');
            }
            else {
                dropdown.classList.remove('autocomplete-full-height');
            }
        };
        AutocompleteBase.prototype.ngOnInit = function () {
            var _this = this;
            document.addEventListener('click', this.onDocumentClick = function () {
                if (!_this.skipDocumentClick) {
                    _this.showDropdown = false;
                }
                _this.skipDocumentClick = false;
                _this.onDocumentClickCallback.call(_this);
            });
        };
        AutocompleteBase.prototype.ngOnChanges = function (changes) {
            this.initInputElement();
            if (changes['dropdown'] != null) {
                if (this.isFalse(changes['dropdown'].currentValue)) {
                    this.inputElement.removeAttribute('readonly');
                }
                else {
                    this.inputElement.setAttribute('readonly', '');
                }
            }
            else if (changes['values'] != null) {
                this.decryptionCache = {};
            }
        };
        AutocompleteBase.prototype.ngAfterViewInit = function () {
            this.dropdownOuterContainer.appendChild(this.dropdownContainer.nativeElement);
            if (this.cssClass != null) {
                this.dropdownOuterContainer.classList.add(this.cssClass);
            }
        };
        AutocompleteBase.prototype.ngAfterViewChecked = function () {
            if (this.disabled || !this.showDropdown) {
                return;
            }
            this.updateDropdownPosition();
        };
        AutocompleteBase.prototype.registerOnChange = function (fn) {
            this.onChange = fn;
        };
        AutocompleteBase.prototype.registerOnTouched = function (fn) {
            this.onTouched = fn;
        };
        AutocompleteBase.prototype.setDisabledState = function (isDisabled) {
            this.disabled = isDisabled;
        };
        AutocompleteBase.prototype.ngOnDestroy = function () {
            document.removeEventListener('click', this.onDocumentClick);
            document.removeEventListener('scroll', this.onDocumentEvent);
            document.removeEventListener('resize', this.onDocumentEvent);
            this.dropdownOuterContainer.remove();
        };
        AutocompleteBase.prototype.isSelected = function (value) {
            return false;
        };
        AutocompleteBase.prototype.onKeyUp = function (event) {
            if (event.keyCode === 40) { // down
                var el = this.dropdownContainer.nativeElement;
                var items = el.querySelectorAll('.autocomplete-dropdown-item');
                if (items.length > 0) {
                    var first = items.item(0).firstElementChild;
                    first.focus();
                }
                return;
            }
        };
        AutocompleteBase.prototype.onInputClick = function (event) {
            // empty
        };
        AutocompleteBase.prototype.getTitleAttrValueForItem = function (value) {
            var title = this.getTitleForItem(value);
            return this.stripTagsFromString(title instanceof HTMLElement ? title.innerHTML : title);
        };
        AutocompleteBase.prototype.select = function (item, event) {
            this.decryptionCache = {};
        };
        return AutocompleteBase;
    }());

    var __extends = (undefined && undefined.__extends) || (function () {
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
    var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
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
            _this.changeInput = new core.EventEmitter();
            _this.showDropdownChange = new core.EventEmitter();
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
            core.Input(),
            __metadata("design:type", Array)
        ], AutocompleteComponent.prototype, "values", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Object)
        ], AutocompleteComponent.prototype, "highlight", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Object)
        ], AutocompleteComponent.prototype, "dropdown", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Object)
        ], AutocompleteComponent.prototype, "disabled", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Object)
        ], AutocompleteComponent.prototype, "required", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Object)
        ], AutocompleteComponent.prototype, "placeholder", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Function)
        ], AutocompleteComponent.prototype, "valueGetter", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Function)
        ], AutocompleteComponent.prototype, "descriptionGetter", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Object)
        ], AutocompleteComponent.prototype, "stripTags", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Object)
        ], AutocompleteComponent.prototype, "free", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Number)
        ], AutocompleteComponent.prototype, "maxlength", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", Object)
        ], AutocompleteComponent.prototype, "spellcheck", void 0);
        __decorate([
            core.Input(),
            __metadata("design:type", String)
        ], AutocompleteComponent.prototype, "cssClass", void 0);
        __decorate([
            core.Output(),
            __metadata("design:type", core.EventEmitter)
        ], AutocompleteComponent.prototype, "changeInput", void 0);
        __decorate([
            core.Output(),
            __metadata("design:type", core.EventEmitter)
        ], AutocompleteComponent.prototype, "showDropdownChange", void 0);
        __decorate([
            core.ViewChild('dropdownContainer', { static: true }),
            __metadata("design:type", core.ElementRef)
        ], AutocompleteComponent.prototype, "dropdownContainer", void 0);
        AutocompleteComponent = AutocompleteComponent_1 = __decorate([
            core.Component({
                selector: 'deltix-ng-autocomplete',
                template: "\n        <div class=\"deltix-autocomplete\" [ngClass]=\"cssClass\">\n            <div class=\"autocomplete-container\" (mousedown)=\"onAutocompleteClick($event)\">\n                <input type=\"text\" class=\"autocomplete-input\" spellcheck=\"spellcheck\" [(ngModel)]=\"selectedText\" [title]=\"selectedText\" [disabled]=\"disabled\" [maxlength]=\"maxlength\" [placeholder]=\"placeholder\" (focus)=\"onFocus($event)\" (input)=\"onInput($event)\" (keyup)=\"onKeyUp($event)\" (blur)=\"onBlur($event)\" (click)=\"onInputClick($event)\">\n                <button *ngIf=\"dropdown && !disabled\" (click)=\"toggleDropdown($event)\" type=\"button\" class=\"autocomplete-caret-btn\"><i class=\"autocomplete-caret\"></i></button>\n                <div class=\"autocomplete-dropdown-container\" #dropdownContainer>\n                    <div class=\"autocomplete-dropdown\" *ngIf=\"!disabled\">\n                        <div class=\"autocomplete-dropdown-menu-wrapper\" *ngIf=\"isShowDropdown()\">\n                            <ul class=\"autocomplete-dropdown-menu\">\n                                <li *ngFor=\"let item of values\" class=\"autocomplete-dropdown-item\" [class.autocomplete-active]=\"isSelected(item)\" [title]=\"getTitleAttrValueForItem(item)\">\n                                    <a href=\"#\" (click)=\"select(item,$event)\" (keyup)=\"onElementKeyUp($event)\" [appAutocompleteDescription]=\"highlightTitle(item)\">\n                                    </a>\n                                </li>\n                                <ng-content></ng-content>\n                            </ul>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    ",
                providers: [{
                        provide: forms.NG_VALUE_ACCESSOR,
                        multi: true,
                        useExisting: core.forwardRef(function () { return AutocompleteComponent_1; }),
                    }]
            })
            // tslint:enable:max-line-length
            ,
            __metadata("design:paramtypes", [core.ElementRef])
        ], AutocompleteComponent);
        return AutocompleteComponent;
    }(AutocompleteBase));

    function smartSplit(text, separator, literal) {
        var textArray = [];
        var str = '';
        for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
            var symbol = text_1[_i];
            if (symbol === literal) {
                if (!str.includes(literal)) {
                    str += symbol;
                }
                else {
                    textArray.push(str.replace(literal, ''));
                    str = '';
                }
            }
            else if (symbol === separator && !str.includes(literal)) {
                if (str !== '') {
                    textArray.push(str);
                    str = '';
                }
            }
            else {
                str += symbol;
            }
        }
        if (str !== '') {
            textArray.push(str);
        }
        return textArray;
    }
    function smartLastIndexOf(text, separator, literal) {
        var countLiteral = getCountLiteral(text, literal);
        if (countLiteral === 0) {
            return text.lastIndexOf(separator);
        }
        else if (countLiteral % 2 === 0) {
            var lastIndexLiteral = text.lastIndexOf(literal);
            if (text.substring(lastIndexLiteral).includes(separator)) {
                return text.lastIndexOf(separator);
            }
            var str = text.substring(0, lastIndexLiteral);
            return str.lastIndexOf(literal) - 1;
        }
        return text.lastIndexOf(literal) - 1;
    }
    function smartIndexOf(text, separator, literal) {
        var countLiteral = getCountLiteral(text, literal);
        var index = text.indexOf(separator);
        if (countLiteral != null && countLiteral % 2 === 1 && index !== -1) {
            return text.indexOf(literal) + 1;
        }
        else if (text.indexOf(literal) === 0 && countLiteral % 2 === 0) {
            return text.replace(literal, '').indexOf(literal) + 2;
        }
        return index;
    }
    function getCountLiteral(text, literal) {
        var count = 0;
        for (var _i = 0, text_2 = text; _i < text_2.length; _i++) {
            var symbol = text_2[_i];
            if (symbol === literal) {
                count++;
            }
        }
        return count;
    }
    function correctPasteString(text, separator, literal) {
        var count = 0;
        var str = '';
        for (var _i = 0, text_3 = text; _i < text_3.length; _i++) {
            var symbol = text_3[_i];
            if (symbol === literal) {
                count++;
                if (count === 2) {
                    count = 0;
                    str += symbol;
                    str += separator;
                }
                else {
                    if (str !== '' && str[str.length - 1] !== literal && str[str.length - 1] !== separator) {
                        str += separator;
                    }
                    str += symbol;
                }
            }
            else {
                str += symbol;
            }
        }
        return str;
    }
    function smartJoin(selectedValues, separator, literal) {
        return selectedValues.map(function (value) {
            return value != null && value.includes(separator) ? "" + literal + value + literal : value;
        }).join(separator);
    }

    var __extends$1 = (undefined && undefined.__extends) || (function () {
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
    var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$1 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    // tslint:disable:max-line-length
    var ExtendedTextareaComponent = /** @class */ (function (_super) {
        __extends$1(ExtendedTextareaComponent, _super);
        function ExtendedTextareaComponent(element) {
            var _this = _super.call(this, element) || this;
            _this.highlight = true;
            _this.disabled = false;
            _this.placeholder = '';
            _this.literal = '"';
            _this.stripTags = true;
            _this.allowSelectFirst = false;
            _this.spellcheck = true;
            _this.changeInput = new core.EventEmitter();
            _this.showDropdownChange = new core.EventEmitter();
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
        __decorate$1([
            core.Input(),
            __metadata$1("design:type", Array)
        ], ExtendedTextareaComponent.prototype, "values", void 0);
        __decorate$1([
            core.Input(),
            __metadata$1("design:type", Object)
        ], ExtendedTextareaComponent.prototype, "highlight", void 0);
        __decorate$1([
            core.Input(),
            __metadata$1("design:type", Object)
        ], ExtendedTextareaComponent.prototype, "disabled", void 0);
        __decorate$1([
            core.Input(),
            __metadata$1("design:type", Object)
        ], ExtendedTextareaComponent.prototype, "placeholder", void 0);
        __decorate$1([
            core.Input(),
            __metadata$1("design:type", Object)
        ], ExtendedTextareaComponent.prototype, "literal", void 0);
        __decorate$1([
            core.Input(),
            __metadata$1("design:type", Function)
        ], ExtendedTextareaComponent.prototype, "descriptionGetter", void 0);
        __decorate$1([
            core.Input(),
            __metadata$1("design:type", Object)
        ], ExtendedTextareaComponent.prototype, "stripTags", void 0);
        __decorate$1([
            core.Input(),
            __metadata$1("design:type", Object)
        ], ExtendedTextareaComponent.prototype, "allowSelectFirst", void 0);
        __decorate$1([
            core.Input(),
            __metadata$1("design:type", String)
        ], ExtendedTextareaComponent.prototype, "cssClass", void 0);
        __decorate$1([
            core.Input(),
            __metadata$1("design:type", Object)
        ], ExtendedTextareaComponent.prototype, "spellcheck", void 0);
        __decorate$1([
            core.Output(),
            __metadata$1("design:type", core.EventEmitter)
        ], ExtendedTextareaComponent.prototype, "changeInput", void 0);
        __decorate$1([
            core.Output(),
            __metadata$1("design:type", core.EventEmitter)
        ], ExtendedTextareaComponent.prototype, "showDropdownChange", void 0);
        __decorate$1([
            core.ViewChild('dropdownContainer', { static: true }),
            __metadata$1("design:type", core.ElementRef)
        ], ExtendedTextareaComponent.prototype, "dropdownContainer", void 0);
        ExtendedTextareaComponent = ExtendedTextareaComponent_1 = __decorate$1([
            core.Component({
                selector: 'deltix-ng-extended-textarea',
                template: "\n        <div class=\"deltix-autocomplete\" [ngClass]=\"cssClass\">\n            <div class=\"autocomplete-container\" (mousedown)=\"onAutocompleteClick($event)\">\n                <textarea type=\"text\" spellcheck=\"spellcheck\" [(ngModel)]=\"selectedText\" [title]=\"selectedText\" (focus)=\"onFocus($event)\" (paste)=\"onPaste($event)\" (input)=\"onInput($event)\" (keyup)=\"onKeyUp($event)\" (keydown)=\"onKeyDown($event)\" (click)=\"onClick($event)\" (blur)=\"onBlur($event)\" [disabled]=\"disabled\" class=\"autocomplete-input\" [placeholder]=\"placeholder\"></textarea>\n                <button *ngIf=\"!disabled\" (click)=\"toggleDropdown($event)\" type=\"button\" class=\"autocomplete-caret-btn\"><i class=\"autocomplete-caret\"></i></button>\n                <div class=\"autocomplete-dropdown-container\" #dropdownContainer>\n                    <div class=\"autocomplete-dropdown\" *ngIf=\"!disabled\">\n                        <div class=\"autocomplete-dropdown-menu-wrapper\" *ngIf=\"isShowDropdown()\">\n                            <ul class=\"autocomplete-dropdown-menu\">\n                                <li *ngFor=\"let item of values; first as isFirst\" class=\"autocomplete-dropdown-item\" [title]=\"getTitleAttrValueForItem(item)\">\n                                    <a href=\"#\" (click)=\"select(item,$event)\" (keyup)=\"onElementKeyUp($event)\" [appAutocompleteDescription]=\"highlightTitle(item)\" [ngClass]=\"{'active':isFirst && allowSelectFirst && hasInput()}\"></a>\n                                </li>\n                            </ul>\n                            <ng-content></ng-content>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    ",
                providers: [{
                        provide: forms.NG_VALUE_ACCESSOR,
                        multi: true,
                        useExisting: core.forwardRef(function () { return ExtendedTextareaComponent_1; }),
                    }]
            })
            // tslint:enable:max-line-length
            ,
            __metadata$1("design:paramtypes", [core.ElementRef])
        ], ExtendedTextareaComponent);
        return ExtendedTextareaComponent;
    }(AutocompleteBase));

    var __extends$2 = (undefined && undefined.__extends) || (function () {
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
    var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$2 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    // tslint:disable:max-line-length
    var MultiAutocompleteComponent = /** @class */ (function (_super) {
        __extends$2(MultiAutocompleteComponent, _super);
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
            _this.changeInput = new core.EventEmitter();
            _this.showDropdownChange = new core.EventEmitter();
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
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", Array)
        ], MultiAutocompleteComponent.prototype, "values", void 0);
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", Object)
        ], MultiAutocompleteComponent.prototype, "highlight", void 0);
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", Object)
        ], MultiAutocompleteComponent.prototype, "disabled", void 0);
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", Object)
        ], MultiAutocompleteComponent.prototype, "placeholder", void 0);
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", Function)
        ], MultiAutocompleteComponent.prototype, "valueGetter", void 0);
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", Function)
        ], MultiAutocompleteComponent.prototype, "descriptionGetter", void 0);
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", Object)
        ], MultiAutocompleteComponent.prototype, "stripTags", void 0);
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", Object)
        ], MultiAutocompleteComponent.prototype, "allowSelectFirst", void 0);
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", Object)
        ], MultiAutocompleteComponent.prototype, "dropdown", void 0);
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", Object)
        ], MultiAutocompleteComponent.prototype, "miniFilter", void 0);
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", String)
        ], MultiAutocompleteComponent.prototype, "cssClass", void 0);
        __decorate$2([
            core.Input(),
            __metadata$2("design:type", Object)
        ], MultiAutocompleteComponent.prototype, "spellcheck", void 0);
        __decorate$2([
            core.Output(),
            __metadata$2("design:type", core.EventEmitter)
        ], MultiAutocompleteComponent.prototype, "changeInput", void 0);
        __decorate$2([
            core.Output(),
            __metadata$2("design:type", core.EventEmitter)
        ], MultiAutocompleteComponent.prototype, "showDropdownChange", void 0);
        __decorate$2([
            core.ViewChild('dropdownContainer', { static: true }),
            __metadata$2("design:type", core.ElementRef)
        ], MultiAutocompleteComponent.prototype, "dropdownContainer", void 0);
        __decorate$2([
            core.ViewChild('miniFilter', { static: true }),
            __metadata$2("design:type", core.ElementRef)
        ], MultiAutocompleteComponent.prototype, "miniFilterElementRef", void 0);
        MultiAutocompleteComponent = MultiAutocompleteComponent_1 = __decorate$2([
            core.Component({
                selector: 'deltix-ng-multi-autocomplete',
                template: "\n        <div class=\"deltix-autocomplete\" [ngClass]=\"cssClass\">\n            <div class=\"autocomplete-container\" (mousedown)=\"onAutocompleteClick($event)\">\n                <textarea type=\"text\" spellcheck=\"spellcheck\" [(ngModel)]=\"selectedText\" [title]=\"selectedText\" (focus)=\"onFocus($event)\" (input)=\"onInput($event)\" (keyup)=\"onKeyUp($event)\" (keydown)=\"onKeyDown($event)\" (click)=\"onClick($event)\" (blur)=\"onBlur($event)\" [disabled]=\"disabled\" class=\"autocomplete-input\" [placeholder]=\"placeholder\"></textarea>\n                <button *ngIf=\"!disabled\" (click)=\"toggleDropdown($event)\" type=\"button\" class=\"autocomplete-caret-btn\"><i class=\"autocomplete-caret\"></i></button>\n                <div class=\"autocomplete-dropdown-container\" #dropdownContainer>\n                    <div class=\"autocomplete-dropdown\" *ngIf=\"!disabled\">\n                        <div class=\"autocomplete-dropdown-menu-wrapper\" *ngIf=\"isShowDropdown()\">\n                            <div class=\"autocomplete-mini-filter\" *ngIf=\"miniFilter\">\n                                <input type=\"text\" #miniFilter class=\"autocomplete-input\" (click)=\"onMiniFilterClick($event)\" [(ngModel)]=\"miniFilterText\" placeholder=\"Search...\" />\n                            </div>\n                            <ul class=\"autocomplete-dropdown-menu\">\n                                <li *ngFor=\"let item of valuesForRender; first as isFirst\" class=\"autocomplete-dropdown-item\" [class.autocomplete-active]=\"isSelected(item)\" [title]=\"getTitleAttrValueForItem(item)\">\n                                    <a href=\"#\" (click)=\"select(item,$event)\" (keyup)=\"onElementKeyUp($event)\" [appAutocompleteDescription]=\"highlightTitle(item)\" [ngClass]=\"{'active':isFirst && allowSelectFirst && hasInput()}\"></a>\n                                </li>\n                            </ul>\n                            <ng-content></ng-content>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    ",
                providers: [{
                        provide: forms.NG_VALUE_ACCESSOR,
                        multi: true,
                        useExisting: core.forwardRef(function () { return MultiAutocompleteComponent_1; }),
                    }]
            })
            // tslint:enable:max-line-length
            ,
            __metadata$2("design:paramtypes", [core.ElementRef])
        ], MultiAutocompleteComponent);
        return MultiAutocompleteComponent;
    }(ExtendedTextareaComponent));

    var __decorate$3 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$3 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var SafeHtmlPipe = /** @class */ (function () {
        function SafeHtmlPipe(sanitizer) {
            this.sanitizer = sanitizer;
        }
        SafeHtmlPipe.prototype.transform = function (value) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (value == null) {
                return '';
            }
            return this.sanitizer.sanitize(core.SecurityContext.HTML, value);
        };
        SafeHtmlPipe = __decorate$3([
            core.Pipe({
                name: 'safeHtml'
            }),
            __metadata$3("design:paramtypes", [platformBrowser.DomSanitizer])
        ], SafeHtmlPipe);
        return SafeHtmlPipe;
    }());

    var __decorate$4 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$4 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
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
        __decorate$4([
            core.Input(),
            __metadata$4("design:type", Object)
        ], AutocompleteDescriptionDirective.prototype, "appAutocompleteDescription", void 0);
        AutocompleteDescriptionDirective = __decorate$4([
            core.Directive({
                selector: '[appAutocompleteDescription]'
            }),
            __metadata$4("design:paramtypes", [core.ElementRef, platformBrowser.DomSanitizer])
        ], AutocompleteDescriptionDirective);
        return AutocompleteDescriptionDirective;
    }());

    var __decorate$5 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var AutocompleteModule = /** @class */ (function () {
        function AutocompleteModule() {
        }
        AutocompleteModule = __decorate$5([
            core.NgModule({
                imports: [
                    forms.FormsModule,
                    common.CommonModule
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

    exports.AutocompleteModule = AutocompleteModule;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
