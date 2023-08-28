import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {ControlValueAccessor} from '@angular/forms';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'deltix-ng-autocomplete-base',
  template: '',
  // tslint:disable-next-line:component-class-suffix
})
export abstract class AutocompleteBase
  implements
    ControlValueAccessor,
    OnDestroy,
    OnChanges,
    AfterViewInit,
    AfterViewChecked,
    OnChanges,
    OnInit
{
  public selectedText = '';
  public disabled: boolean;
  public cssClass: string;
  protected inputElement: HTMLInputElement;
  protected onDocumentClick: () => any;
  protected skipDocumentClick = false;
  protected onChange: any = Function.prototype;
  protected onTouched: any = Function.prototype;
  protected changeInput: EventEmitter<string>;
  protected valueGetter: (value: any) => string;
  protected descriptionGetter: (value: any, highlightFunc: (str: string) => string) => string;
  protected highlight: boolean;
  protected stripTags = true;
  protected values: Array<any>;
  protected dropdownOuterContainer: HTMLElement;
  protected dropdownContainer: ElementRef;
  protected onDocumentEvent: () => void;
  protected showDropdownChange: EventEmitter<boolean>;
  protected tempDiv = document.createElement('DIV');

  public constructor(protected element: ElementRef) {
    this.dropdownOuterContainer = document.createElement('div');
    this.dropdownOuterContainer.classList.add(
      'deltix-autocomplete',
      'autocomplete-outer-container',
    );
    document.body.appendChild(this.dropdownOuterContainer);
    this.onDocumentEvent = () => {
      this.updateDropdownPosition();
      this.onChangePosition();
    };
    document.addEventListener('scroll', this.onDocumentEvent, true);
    window.addEventListener('resize', this.onDocumentEvent, true);
  }

  private _showDropdown = false;

  public get showDropdown(): boolean {
    return this._showDropdown;
  }

  public set showDropdown(value: boolean) {
    this.setShowDropdown(value);
  }

  public onAutocompleteClick(event: any) {
    this.skipDocumentClick = true;
  }

  public onInput(event: KeyboardEvent) {
    const element = <HTMLInputElement>event.target;
    this.inputEmit(element.value);
  }

  public onFocus(event: Event) {
    this.showDropdown = true;
  }

  public ngOnInit(): void {
    document.addEventListener(
      'click',
      (this.onDocumentClick = () => {
        if (!this.skipDocumentClick) {
          this.showDropdown = false;
        }
        this.skipDocumentClick = false;
        this.onDocumentClickCallback.call(this);
      }),
    );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.initInputElement();
    if (changes['dropdown'] != null) {
      if (this.isFalse(changes['dropdown'].currentValue)) {
        this.inputElement.removeAttribute('readonly');
      } else {
        this.inputElement.setAttribute('readonly', '');
      }
    }
  }

  public ngAfterViewInit() {
    this.dropdownOuterContainer.appendChild(this.dropdownContainer.nativeElement);
    if (this.cssClass != null) {
      this.dropdownOuterContainer.classList.add(this.cssClass);
    }
  }

  public ngAfterViewChecked() {
    if (this.disabled || !this.showDropdown) {
      return;
    }
    this.updateDropdownPosition();
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public abstract writeValue(obj: any): void;

  public ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('scroll', this.onDocumentEvent);
    window.removeEventListener('resize', this.onDocumentEvent);
    this.dropdownOuterContainer.remove();
  }

  public isSelected(value: any): boolean {
    return false;
  }

  public onKeyUp(event: KeyboardEvent) {
    if (event.keyCode === 40) {
      // down
      const el = <HTMLElement>this.dropdownContainer.nativeElement;
      const items = el.querySelectorAll('.autocomplete-dropdown-item');
      if (items.length > 0) {
        const first: HTMLElement = <HTMLElement>items.item(0).firstElementChild;
        first.focus();
      }
      return;
    }
  }

  public onInputClick(event: Event) {}
  
  public onChangePosition() {
  }

  public getTitleAttrValueForItem(value: any): string {
    const title = this.getTitleForItem(value);
    return this.stripTagsFromString(title);
  }

  public abstract select(item: any, event: Event): void;

  public abstract onBlur(event: Event): void;

  protected setShowDropdown(value: boolean) {
    this._showDropdown = value;
    if (this.showDropdownChange != null) {
      this.showDropdownChange.emit(this._showDropdown);
    }
  }

  protected onElementKeyUp(event: KeyboardEvent) {
    if (event.keyCode === 40) {
      // down
      const next = (<HTMLElement>event.target).parentElement.nextElementSibling;
      if (next != null && next['tagName'] === 'LI') {
        const a = <HTMLElement>next.firstElementChild;
        a.focus();
      }
    } else if (event.keyCode === 38) {
      // up
      const prev = (<HTMLElement>event.target).parentElement.previousElementSibling;
      if (prev != null && prev['tagName'] === 'LI') {
        const a = <HTMLElement>prev.firstElementChild;
        a.focus();
      } else {
        this.inputElement.focus();
      }
    }
  }

  protected inputEmit(str: string) {
    this.changeInput.emit(str);
  }

  protected toggleDropdown(event: Event) {
    this.showDropdown = !this.showDropdown;
  }

  protected highlightTitle(item: any): string {
    let text: string = this.getTitleForItem(item);
    if (this.isTrue(this.stripTags)) {
      text = this.stripTagsFromString(text);
      if (this.isTrue(this.highlight)) {
        return this.highlightText(text, this.selectedText);
      }
    }
    return text;
  }

  protected escapeRegExp(str: string): string {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  protected highlightText(text: string, highlightStr: string): string {
    const regexp = new RegExp(`(${this.escapeRegExp(highlightStr)})`, 'im');
    return text.replace(regexp, '<span>$1</span>');
  }

  protected getValueForItem(item: any, separator?: string, literal?: string): string {
    if (item == null) {
      return '';
    }
    if (typeof item === 'string') {
      if (item.includes(separator)) {
        return `${literal}${item}${literal}`;
      }
      return item;
    }
    if (typeof item === 'number') {
      return item + '';
    }
    if (typeof this.valueGetter === 'function') {
      return this.valueGetter.call(null, item);
    }

    return '[object]';
  }

  protected getTitleForItem(item: any): string {
    if (item != null && typeof this.descriptionGetter === 'function') {
      return this.descriptionGetter.call(null, item, (str: string) =>
        this.highlightText(str, this.selectedText),
      );
    }

    return this.getValueForItem(item);
  }

  protected stripTagsFromString(str: string) {
    const tmp = this.tempDiv;
    tmp.innerHTML = str;
    return tmp.textContent || tmp.innerText || '';
  }

  protected initInputElement() {
    if (this.inputElement == null) {
      this.inputElement = this.element.nativeElement.querySelector('input');
    }
  }

  protected onDocumentClickCallback() {
    // empty method
  }

  protected isFalse(value: boolean | string): boolean {
    if (typeof value === 'string') {
      return value === 'false';
    }
    return !value;
  }

  protected isTrue(value: boolean | string): boolean {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  }

  protected isShowDropdown(): boolean {
    return this.showDropdown && this.values.length > 0;
  }

  protected updateDropdownPosition() {
    const div: HTMLElement = this.element.nativeElement;
    const rect = div.getBoundingClientRect();
    const dropdown: HTMLElement = this.dropdownContainer.nativeElement;

    const dropdownRect = dropdown.getBoundingClientRect();
    const offset = rect.top + rect.height;

    let fullHeight = false;
    if (window.innerHeight < offset + dropdownRect.height || offset < 0) {
      if (rect.top - dropdownRect.height < 0) {
        dropdown.style.top = '0px';
        if (dropdownRect.height >= window.innerHeight) {
          fullHeight = true;
          dropdown.style.maxHeight = dropdownRect.height + 'px';
        }
      } else {
        dropdown.style.top = rect.top - dropdownRect.height + 'px';
      }
    } else {
      dropdown.style.top = offset + 'px';
    }
    dropdown.style.width = rect.width + 'px';
    dropdown.style.left = rect.left + 'px';

    if (fullHeight) {
      dropdown.classList.add('autocomplete-full-height');
    } else {
      dropdown.classList.remove('autocomplete-full-height');
    }
  }
}
