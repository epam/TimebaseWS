import {SimpleChanges} from '@angular/core';
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
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {timer} from 'rxjs';

import {AutocompleteBase} from './autocomplete-base';

// tslint:disable:max-line-length
@Component({
  selector: 'deltix-ng-autocomplete',
  template: `
    <div class="deltix-autocomplete" (appClickOutside)="closeDropDown()" [ngClass]="cssClass">
      <div class="autocomplete-container" (click)="onAutocompleteClick($event)">
        <input
          type="text"
          class="autocomplete-input"
          [(ngModel)]="selectedText"
          [title]="selectedText"
          [disabled]="disabled"
          [size]="size"
          [maxlength]="maxlength"
          [placeholder]="placeholder"
          [class.edited]="edited"
          [class.invalid]="invalid"
          (focus)="onFocus($event)"
          (input)="onInput($event)"
          (keyup)="onKeyUp($event)"
          (blur)="onBlur($event)"
          (click)="onInputClick($event)" />
        <button
          *ngIf="dropdown && !disabled"
          (click)="toggleDropdown($event)"
          class="autocomplete-caret-btn">
          <i class="autocomplete-caret"></i>
        </button>
        <div class="autocomplete-dropdown-container" #dropdownContainer>
          <div class="autocomplete-dropdown" *ngIf="!disabled">
            <div class="autocomplete-dropdown-menu-wrapper" *ngIf="isShowDropdown()">
              <cdk-virtual-scroll-viewport
                [style.height.px]="autoCompleteHeight"
                style="pointer-events: initial"
                maxBufferPx="320"
                minBufferPx="320"
                [itemSize]="itemHeight">
                <ul>
                  <li
                    *cdkVirtualFor="let item of filteredValues"
                    class="autocomplete-dropdown-item"
                    [class.autocomplete-active]="isSelected(item)"
                    [title]="getTitleAttrValueForItem(item)">
                    <a
                      href="#"
                      (click)="select(item, $event)"
                      (keyup)="onElementKeyUp($event)"
                      [innerHTML]="highlightTitle(item) | safeHtml"></a>
                  </li>
                </ul>
              </cdk-virtual-scroll-viewport>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => AutocompleteComponent),
    },
  ],
})
export class AutocompleteComponent
  extends AutocompleteBase
  implements OnInit, ControlValueAccessor, OnDestroy, OnChanges
{
  @ViewChild('dropdownContainer') dropdownContainer: ElementRef;

  @Input() dropdown = false;
  @Input() placeholder = '';
  @Input() maxlength: number;
  @Input() required = false;
  @Input() free = false;
  @Input() cssClass: string;
  @Input() descriptionGetter: (value: any, highlightFunc: (str: string) => string) => string;
  @Input() disabled = false;
  @Input() stripTags = true;
  @Input() highlight = true;
  @Input() valueGetter: (value: any) => string;
  @Input() values: Array<any>;
  @Input() size: number = 20;
  @Input() allOptionsOnClick: boolean = false;
  @Input() edited: boolean = false;
  @Input() invalid: boolean = false;
  @Input() filterDisabled: boolean = false;

  @Output() changeInput: EventEmitter<string> = new EventEmitter<string>();
  @Output() showDropdownChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() selectItem: EventEmitter<any> = new EventEmitter<any>();

  selectedValue: any;
  filteredValues: any[];
  autoCompleteHeight = 0;
  itemHeight = 25;

  isSelected(value: any): boolean {
    return this.selectedValue === value;
  }

  onBlur(event: Event) {
    timer().subscribe(() => {
      if (this.free && !this.dropdown) {
        return;
      }
      this.selectedText = this.getValueForItem(this.selectedValue);
    });
  }

  onFocus(event: Event) {
    if (this.dropdown) {
      return;
    }
    
    this.countHeight();
    super.onFocus(event);
  }

  isShowDropdown() {
    return super.isShowDropdown();
  }

  onInputClick(event: Event) {
    if (!this.filteredValues.length) {
      this.showDropdown = false;
      return;
    }
    if (!this.dropdown) {
      return;
    }
    this.showDropdown = !this.showDropdown;
  }

  onKeyUp(event: KeyboardEvent) {
    super.onKeyUp(event);

    if (this.selectedText.length === 0 && this.required + '' !== 'true') {
      this.selectedValue = null;
      this.onChange(null);
    }

    this.showDropdown = event.keyCode !== 13;

    if (event.keyCode !== 40) {
      this.filterValues();
    }
  }

  select(item: any, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.selectedText = this.getValueForItem(item);
    this.selectedValue = item;
    this.onChange(item);
    this.selectItem.emit(item);
    this.showDropdown = false;
    this.allOptionsOnClick ? this.showAllValues() : this.filterValues();
  }

  writeValue(obj: any): void {
    this.selectedValue = obj;
    this.selectedText = this.getValueForItem(this.selectedValue);
  }

  closeDropDown() {
    this.showDropdown = false;
  }

  openDropdown() {
    this.showDropdown = true;
  }
  
  onChangePosition() {
    this.countHeight();
  }

  ngOnChanges(changes: SimpleChanges) {
    super.ngOnChanges(changes);
    this.allOptionsOnClick ? this.showAllValues() : this.filterValues();
  }

  private showAllValues() {
    this.filteredValues = this.values;
    this.countHeight();
  }

  private filterValues() {
    this.filteredValues = this.filterDisabled ? this.values : this.values?.filter(
      (value) => !this.selectedText || this.unifyValue(value).includes(this.unifyValue(this.selectedText)),
    );
    if (!this.filteredValues.length) {
      this.showDropdown = false;
    }

    this.countHeight();
  }

  private countHeight() {
    const rect: ClientRect = this.element.nativeElement.getBoundingClientRect();
    const minHeight = Math.min(350, window.innerHeight - (rect.top + rect.height + 10));
    this.autoCompleteHeight = Math.min(this.filteredValues.length * this.itemHeight, minHeight);
  }
  
  private unifyValue(value: string): string {
    return value?.toString().replace(/( |\r\n)+/g, ' ').toLowerCase();
  }
}
