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

import { AutocompleteBase } from './autocomplete-base';

// tslint:disable:max-line-length
@Component({
  selector: 'deltix-ng-autocomplete',
  template: `
    <div class="deltix-autocomplete" [ngClass]="cssClass">
      <div class="autocomplete-container" (click)="onAutocompleteClick($event)">
        <input type="text" class="autocomplete-input" [(ngModel)]="selectedText" [title]="selectedText" [disabled]="disabled" [maxlength]="maxlength" [placeholder]="placeholder" (focus)="onFocus($event)" (input)="onInput($event)" (keyup)="onKeyUp($event)" (blur)="onBlur($event)" (click)="onInputClick($event)">
        <button *ngIf="dropdown && !disabled" (click)="toggleDropdown($event)" class="autocomplete-caret-btn">
          <i class="autocomplete-caret"></i></button>
        <div class="autocomplete-dropdown-container" #dropdownContainer>
          <div class="autocomplete-dropdown" *ngIf="!disabled">
            <div class="autocomplete-dropdown-menu-wrapper" *ngIf="isShowDropdown()">
              <ul class="autocomplete-dropdown-menu">
                <li *ngFor="let item of values" class="autocomplete-dropdown-item" [class.autocomplete-active]="isSelected(item)" [title]="getTitleAttrValueForItem(item)">
                  <a href="#" (click)="select(item,$event)" (keyup)="onElementKeyUp($event)" [innerHTML]="highlightTitle(item) | safeHtml"></a>
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
    useExisting: forwardRef(() => AutocompleteComponent),
  }],
})
// tslint:enable:max-line-length
export class AutocompleteComponent extends AutocompleteBase implements OnInit, ControlValueAccessor, OnDestroy, OnChanges {
  
  @Input()
  protected values: Array<any>;
  @Input()
  protected highlight = true;
  @Input()
  public dropdown = false;
  @Input()
  public disabled = false;
  @Input()
  protected required = false;
  @Input()
  public placeholder = '';
  @Input()
  protected valueGetter: (value: any) => string;
  @Input()
  protected descriptionGetter: (value: any, highlightFunc: (str: string) => string) => string;
  @Input()
  protected stripTags = true;
  @Input()
  protected free = false;
  @Input()
  public maxlength: number;
  @Input()
  public cssClass: string;
  @Output()
  protected changeInput: EventEmitter<string> = new EventEmitter<string>();
  @Output()
  protected showDropdownChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  
  protected selectedValue: any;
  
  @ViewChild('dropdownContainer')
  protected dropdownContainer: ElementRef;
  
  constructor(element: ElementRef) {
    super(element);
  }
  
  public writeValue(obj: any): void {
    this.selectedValue = obj;
    this.selectedText = this.getValueForItem(this.selectedValue);
  }
  
  public onBlur(event: Event) {
    if (this.free && !this.dropdown) {
      return;
    }
    this.selectedText = this.getValueForItem(this.selectedValue);
  }
  
  public onKeyUp(event: KeyboardEvent) {
    super.onKeyUp(event);
    
    if (this.selectedText.length === 0 && this.required + '' !== 'true') {
      this.selectedValue = null;
      this.onChange(null);
    }
  }
  
  public isSelected(value: any): boolean {
    return this.selectedValue === value;
  }
  
  public select(item: any, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.selectedText = this.getValueForItem(item);
    this.selectedValue = item;
    this.onChange(item);
    this.showDropdown = false;
  }
  
  public onInput(event: KeyboardEvent) {
    if (this.free && this.selectedValue != null && this.selectedText !== this.getValueForItem(this.selectedValue)) {
      this.selectedValue = null;
      this.onChange(this.selectedValue);
    }
    super.onInput(event);
  }
  
  public onInputClick(event: Event) {
    if (!this.dropdown) {
      return;
    }
    this.showDropdown = !this.showDropdown;
  }
  
  public onFocus(event: Event) {
    if (this.dropdown) {
      return;
    }
    super.onFocus(event);
  }
}
