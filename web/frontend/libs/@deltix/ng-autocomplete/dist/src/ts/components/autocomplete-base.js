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
export { AutocompleteBase };
//# sourceMappingURL=autocomplete-base.js.map