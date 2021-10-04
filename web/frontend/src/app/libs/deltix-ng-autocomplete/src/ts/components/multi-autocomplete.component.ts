import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
}                                                  from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ExtendedTextareaComponent } from './extended-textarea.component';

// tslint:disable:max-line-length
@Component({
  selector: 'deltix-ng-multi-autocomplete',
  template: `
    <div class="deltix-autocomplete" [ngClass]="cssClass">
      <div class="autocomplete-container" (click)="onAutocompleteClick($event)">
        <textarea type="text" [(ngModel)]="selectedText" [title]="selectedText" (focus)="onFocus($event)" (input)="onInput($event)" (keyup)="onKeyUp($event)" (keydown)="onKeyDown($event)" (click)="onClick($event)" (blur)="onBlur($event)" [disabled]="disabled" class="autocomplete-input" [placeholder]="placeholder"></textarea>
        <button *ngIf="!disabled" (click)="toggleDropdown($event)" class="autocomplete-caret-btn">
          <i class="autocomplete-caret"></i></button>
        <div class="autocomplete-dropdown-container" #dropdownContainer>
          <div class="autocomplete-dropdown" *ngIf="!disabled">
            <div class="autocomplete-dropdown-menu-wrapper" *ngIf="isShowDropdown()">
              <div class="autocomplete-mini-filter" *ngIf="miniFilter">
                <input type="text" #miniFilter class="autocomplete-input" (click)="onMiniFilterClick($event)" [(ngModel)]="miniFilterText" placeholder="Search..." />
              </div>
              <ul class="autocomplete-dropdown-menu">
                <li *ngFor="let item of valuesForRender; first as isFirst" class="autocomplete-dropdown-item" [class.autocomplete-active]="isSelected(item)" [title]="getTitleAttrValueForItem(item)">
                  <a href="#" (click)="select(item,$event)" (keyup)="onElementKeyUp($event)" [innerHTML]="highlightTitle(item) | safeHtml" [ngClass]="{'active':isFirst && allowSelectFirst && hasInput()}"></a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    multi: true,
    useExisting: forwardRef(() => MultiAutocompleteComponent),
  }],
})
// tslint:enable:max-line-length
export class MultiAutocompleteComponent extends ExtendedTextareaComponent implements OnInit, ControlValueAccessor, OnDestroy, OnChanges {
  
  @Input()
  protected values: Array<any>;
  @Input()
  protected highlight = true;
  @Input()
  public disabled = false;
  @Input()
  public placeholder = '';
  @Input()
  protected valueGetter: (value: any) => string;
  @Input()
  protected descriptionGetter: (value: any, highlightFunc: (str: string) => string) => string;
  @Input()
  protected stripTags = true;
  @Input()
  protected allowSelectFirst = false;
  @Input()
  public dropdown = false;
  @Input()
  protected miniFilter = false;
  @Input()
  public cssClass: string;
  @Output()
  protected changeInput: EventEmitter<string> = new EventEmitter<string>();
  @Output()
  protected showDropdownChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  
  @ViewChild('dropdownContainer')
  protected dropdownContainer: ElementRef;
  @ViewChild('miniFilter')
  protected miniFilterElementRef: ElementRef;
  
  public miniFilterText = '';
  
  constructor(protected element: ElementRef) {
    super(element);
  }
  
  public writeValue(obj: any): void {
    if (obj instanceof Array) {
      this.selectedValues = obj;
    } else {
      this.selectedValues = [obj];
    }
    this.selectedText = this.prepareInput(this.getValueForItems(this.selectedValues));
  }
  
  public onKeyUp(event: KeyboardEvent) {
    if (this.inputElement.selectionStart === this.inputElement.value.length) {
      super.onKeyUp(event);
    } else {
      this.updateCursorPos();
      this.showDropdown = true;
    }
    
    if (this.selectedText.length === 0) {
      this.selectedValues.length = 0;
      this.onChange([]);
    }
  }
  
  public select(item: any, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    if (this.isTrue(this.dropdown)) {
      const pos = this.selectedValues.indexOf(item);
      if (pos === -1) {
        this.selectedValues.push(item);
      } else {
        this.selectedValues.splice(pos, 1);
      }
    } else {
      if (this.cursorPosition != null) {
        const pos = this.getInputPos(this.cursorPosition);
        const v = this.getValueForItem(item);
        this.selectedText = this.selectedText.substr(0, pos.left) + v + this.selectedText.substr(pos.left + pos.length);
        setTimeout(() => {
          this.inputElement.selectionStart = this.inputElement.selectionEnd = pos.left + v.length;
        });
        this.updateItemsFromInput();
      } else {
        if (this.selectedValues.indexOf(item) >= 0) {
          return;
        }
        this.selectedValues.push(item);
      }
    }
    
    this.selectedText = this.getValueForItems(this.selectedValues);
    this.onChange(this.selectedValues.slice());
    if (!this.miniFilter) {
      this.inputElement.focus();
      this.showDropdown = false;
    }
    this.currentInput = null;
  }
  
  public isSelected(value: any): boolean {
    return this.selectedValues.indexOf(value) >= 0;
  }
  
  protected getValueForItems(items: Array<any>): string {
    let str = '';
    for (let i = 0; i < items.length; i++) {
      str += this.getValueForItem(items[i]);
      if (i + 1 !== items.length) {
        str += this.separator;
      }
    }
    return str;
  }
  
  protected getTitleForItem(item: any): string {
    if (item != null && typeof this.descriptionGetter === 'function') {
      return this.descriptionGetter.call(null, item, (str: string) => {
        const selectedText = (this.hasInput() ? this.currentInput : this.selectedText).split(this.separator);
        for (let i = 0; i < selectedText.length; i++) {
          str = this.highlightText(str, selectedText[i]);
        }
        return str;
      });
    }
    
    return this.getValueForItem(item);
  }
  
  public onInput(event: KeyboardEvent) {
    this.updateItemsFromInput();
    
    this.updateCursorPos();
    if (!this.showDropdown) {
      this.showDropdown = true;
    }
  }
  
  protected updateItemsFromInput() {
    const str = this.selectedText.split(this.separator);
    const values = this.values.slice();
    values.push(...this.selectedValues);
    this.selectedValues.length = 0;
    for (let i = 0; i < values.length; i++) {
      const index = str.indexOf(this.getValueForItem(values[i]));
      if (index >= 0) {
        this.selectedValues[index] = values[i];
      }
    }
    for (let i = 0; i < this.selectedValues.length; i++) {
      if (typeof (this.selectedValues[i]) === 'undefined') {
        this.selectedValues.splice(i, 1);
      }
    }
    this.onChange(this.selectedValues.slice());
  }
  
  protected onDocumentClickCallback() {
    this.selectedText = this.getValueForItems(this.selectedValues);
  }
  
  protected prepareInput(str: string): string {
    const newStr = str.replace(/\r?\n|\r/g, '');
    if (newStr !== str) {
      return ' ' + newStr;
    }
    return newStr;
  }
  
  public onMiniFilterClick(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  protected inputEmit(str: string) {
    if (this.miniFilter) {
      return;
    }
    this.changeInput.emit(str);
  }
  
  public get valuesForRender(): Array<any> {
    if (!this.miniFilter && this.miniFilterText.length === 0 && this.miniFilterText.trim().length === 0) {
      return this.values;
    }
    const filter = this.miniFilterText.trim().toLowerCase();
    return this.values.filter(((i) => {
      const value = this.getValueForItem(i);
      return value.toLowerCase().lastIndexOf(filter) !== -1;
    }));
  }
  
  protected setShowDropdown(value: boolean) {
    if (value && this.miniFilter && this.dropdown) {
      setTimeout(() => {
        if (this.miniFilterElementRef == null) {
          return;
        }
        const element = <HTMLInputElement>this.miniFilterElementRef.nativeElement;
        if (element != null) {
          element.focus();
        }
      });
    }
    super.setShowDropdown(value);
  }
}
