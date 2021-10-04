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

import { Utils }            from '../utils.ts/utils';
import { AutocompleteBase } from './autocomplete-base';

// tslint:disable:max-line-length
@Component({
  selector: 'deltix-ng-extended-textarea',
  template: `
    <div class="deltix-autocomplete" [ngClass]="cssClass">
      <div class="autocomplete-container" (click)="onAutocompleteClick($event)">
        <textarea type="text" [(ngModel)]="selectedText" [title]="selectedText" (focus)="onFocus($event)" (input)="onInput($event)" (keyup)="onKeyUp($event)" (keydown)="onKeyDown($event)" (click)="onClick($event)" (blur)="onBlur($event)" [disabled]="disabled" class="autocomplete-input" [placeholder]="placeholder"></textarea>
        <button *ngIf="!disabled" (click)="toggleDropdown($event)" class="autocomplete-caret-btn">
          <i class="autocomplete-caret"></i></button>
        <div class="autocomplete-dropdown-container" #dropdownContainer>
          <div class="autocomplete-dropdown" *ngIf="!disabled">
            <div class="autocomplete-dropdown-menu-wrapper" *ngIf="isShowDropdown()">
              <ul class="autocomplete-dropdown-menu">
                <li *ngFor="let item of values; first as isFirst" class="autocomplete-dropdown-item" [title]="getTitleAttrValueForItem(item)">
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
    useExisting: forwardRef(() => ExtendedTextareaComponent),
  }],
})
// tslint:enable:max-line-length
export class ExtendedTextareaComponent extends AutocompleteBase implements OnInit, ControlValueAccessor, OnDestroy, OnChanges {
  
  @Input()
  protected values: Array<any>;
  @Input()
  protected highlight = true;
  @Input()
  public disabled = false;
  @Input()
  public placeholder = '';
  @Input()
  public literal = '"';
  @Input()
  protected descriptionGetter: (value: any, highlightFunc: (str: string) => string) => string;
  @Input()
  protected stripTags = true;
  @Input()
  protected allowSelectFirst = false;
  @Input()
  public cssClass: string;
  @Output()
  protected changeInput: EventEmitter<string> = new EventEmitter<string>();
  @Output()
  protected showDropdownChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  
  protected selectedValues: Array<any>;
  protected separator = ' ';
  protected currentInput: string;
  protected cursorPosition: number;
  
  @ViewChild('dropdownContainer')
  protected dropdownContainer: ElementRef;
  
  constructor(element: ElementRef) {
    super(element);
  }
  
  public writeValue(obj: any): void {
    if (obj instanceof Array) {
      this.selectedValues = obj;
    } else {
      this.selectedValues = [obj];
    }
    this.selectedText = this.prepareInput(this.selectedValues.join(this.separator));
  }
  
  public onBlur(event: Event) {
    // this._selectedText = this.getValueForItems(this._selectedValues);
  }
  
  public onKeyUp(event: KeyboardEvent) {
    if (this.inputElement.selectionStart === this.inputElement.value.length) {
      super.onKeyUp(event);
    } else {
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
    } else {
      this.onChange(Utils.smartSplit(this.selectedText, this.separator, this.literal));
    }
  }
  
  public select(item: any, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (this.cursorPosition != null) {
      const pos = this.getInputPos(this.cursorPosition);
      const v = this.getValueForItem(item, this.separator, this.literal);
      this.selectedText = this.selectedText.substr(0, pos.left) + v + this.selectedText.substr(pos.left + pos.length);
      setTimeout(() => {
        this.inputElement.selectionStart = this.inputElement.selectionEnd = pos.left + v.length;
      });
    } else {
      if (this.selectedValues.indexOf(item) >= 0) {
        return;
      }
      if (item.includes(this.separator)) {
        this.selectedValues.push(`${this.literal}${item}${this.literal}`);
      } else {
        this.selectedValues.push(item);
      }
      
    }
    this.onChange(Utils.smartSplit(this.selectedText, this.separator, this.literal));
    this.inputElement.focus();
    this.showDropdown = false;
    this.currentInput = null;
  }
  
  public onKeyDown(event: KeyboardEvent) {
    if (event.keyCode === 13) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  
  public onClick(event: MouseEvent) {
    this.updateCursorPos();
    this.showDropdown = true;
  }
  
  protected initInputElement() {
    if (this.inputElement == null) {
      this.inputElement = this.element.nativeElement.querySelector('textarea');
    }
  }
  
  protected getTitleForItem(item: any): string {
    if (item != null && typeof this.descriptionGetter === 'function') {
      return this.descriptionGetter.call(null, item, (str: string) => {
        if (this.isTrue(this.highlight)) {
          if (this.currentInput == null || this.currentInput.length === 0) {
            return str;
          }
          const selectedText = Utils.smartSplit(this.currentInput, this.separator, this.literal);
          for (let i = 0; i < selectedText.length; i++) {
            str = this.highlightText(str, selectedText[i]);
          }
        }
        return str;
      });
    }
    
    return this.getValueForItem(item);
  }
  
  public onInput(event: KeyboardEvent) {
    this.updateCursorPos();
    if (!this.showDropdown) {
      this.showDropdown = true;
    }
  }
  
  protected updateCursorPos() {
    this.cursorPosition = this.inputElement.selectionStart;
    const pos = this.getInputPos(this.cursorPosition);
    this.currentInput = this.inputElement.value.substr(pos.left, pos.length);
    this.inputEmit(this.prepareInput(this.currentInput));
  }
  
  protected getInputPos(cursorPos: number): { left: number, length: number } {
    let offsetLeft = Utils.smartLastIndexOf(this.inputElement.value.substring(0, cursorPos), this.separator, this.literal);
    if (offsetLeft === -1) {
      offsetLeft = 0;
    } else {
      offsetLeft++;
    }
    const t = this.inputElement.value.substring(cursorPos);
    let offsetRight = Utils.smartIndexOf(t, this.separator, this.literal);
    if (offsetRight === -1) {
      offsetRight = t.length;
    }
    
    return {left: offsetLeft, length: cursorPos - offsetLeft + offsetRight};
  }
  
  protected hasInput(): boolean {
    return this.currentInput != null && this.currentInput.trim().length !== 0;
  }
  
  public onFocus(event: Event) {
    super.onFocus(event);
    this.cursorPosition = null;
  }
  
  protected prepareInput(str: string): string {
    return str.replace(/\r?\n|\r/g, this.separator);
  }
}
