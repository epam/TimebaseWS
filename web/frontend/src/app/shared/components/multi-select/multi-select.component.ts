import {CdkPortal, DomPortal, DomPortalOutlet} from '@angular/cdk/portal';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  forwardRef,
  HostBinding,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {ControlValueAccessor, UntypedFormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import equal from 'fast-deep-equal/es6';
import {interval, Subject } from 'rxjs';
import {distinctUntilChanged, map, startWith, takeUntil, filter } from 'rxjs/operators';
import {ClickOutsideService} from '../../directives/click-outside/click-outside.service';
import { EscapeKeyService } from '../../services/escape-key.service';
import { MultiSelectItem } from './multi-select-item';


@Component({
  selector: 'app-multi-select',
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => MultiSelectComponent),
    },
  ],
})
export class MultiSelectComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit, ControlValueAccessor
{
  @ViewChild(CdkVirtualScrollViewport) private cdkVirtualScrollViewPort: CdkVirtualScrollViewport;
  @ViewChild(CdkPortal) private cdkPortal: CdkPortal;
  @ViewChild('searchInput') private searchInput: ElementRef<HTMLInputElement>;

  @Input() items: MultiSelectItem[];
  @Input() placeholder: string;
  @Input() single = false;
  @Input() search = true;
  @Input() @HostBinding('class.flat-multiselect') flat = false;
  
  @Input() menuItemHeight: number;
  @Input() contextMenuWidth: number;
  @Input() contextMenuHeight: number;
  @Input() hierarchy: boolean;
  @Input() selectionDisabled: boolean = false;
  @Input() initiallySelectedItems: MultiSelectItem[] = [];
  @Input() selectedItem: string;

  open: boolean;
  searchControl = new UntypedFormControl('');
  isSelected: {[index: string]: boolean} = {};
  selected: MultiSelectItem[] | string = [];
  showSelected: MultiSelectItem[] = [];
  hiddenSelected = 0;
  filteredItems = [];
  allSelected: boolean;
  dropDownHeight: number;
  itemHeight: number;
  dropDownTop: number;
  dropDownLeft: number;
  dropDownWidth: number;
  hiddenItems = {};
  matchedField: MultiSelectItem;
  
  private closeDropdown$ = new Subject();
  private maxHeight = 320;
  private destroy$ = new Subject();
  private showLimit = 10;
  private bodyHost: DomPortalOutlet;

  constructor(
    private clickOutsideService: ClickOutsideService,
    private elementRef: ElementRef<HTMLElement>,
    private cdRef: ChangeDetectorRef,
    private cfr: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector,
    private escapeKeyService: EscapeKeyService 
  ) {}

  ngOnInit(): void {

    this.searchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.filterItems();
    });

    this.bodyHost = new DomPortalOutlet(
      document.querySelector('body'),
      this.cfr,
      this.appRef,
      this.injector,
    );
    this.escapeKeyService.escapeKeyPressed$
      .pipe(
        filter(escapeKeyPressed => escapeKeyPressed),
        takeUntil(this.destroy$))
      .subscribe(() => this.detachDropDown());
  }

  ngAfterViewInit() {}

  onClick(item: MultiSelectItem) {
    if (item.hasChildren) {
      this.toggleSubmenu(item.id);
      return;
    }
    if (!this.single) {
      this.isSelected[item.id] = !this.isSelected[item.id];
    } else {
      this.isSelected = {[item.id]: true};
      this.toggleOpen();
    }

    if (this.isSelected[item.id]) {
      if (this.single) {
        this.selected = item.id;
      } else {
        (this.selected as MultiSelectItem[]).push(item);
      }

      this.sortSelected();
      this.finishSelection();
    } else {
      this.remove(item);
    }

    this.onChange(this.selected);
  }

  toggleSubmenu(itemId: string) {
    if (this.filteredItems.find(item => item.parentItem === itemId)) {
      this.hiddenItems[itemId] = this.filteredItems.filter(item => item?.parentItem === itemId);
      this.filteredItems = this.filteredItems.filter(item => item?.parentItem !== itemId);
    } else {
      const itemFilteredChildren = !this.searchControl.value ? 
        this.items.filter(item => item.parentItem === itemId) : this.hiddenItems[itemId];
      const parentItemIndex = this.filteredItems.findIndex(item => item.name === itemId);
      const tempFilteredItems = [...this.filteredItems];
      tempFilteredItems.splice(parentItemIndex + 1, 0, ...itemFilteredChildren);
      this.filteredItems = tempFilteredItems;
    }
  }

  setInitiallySelectedItems() {
    const initiallySelectedItems = [];
    for (let item of this.initiallySelectedItems) {
      this.isSelected[item.id] = true;
      if (Array.isArray(this.selected)) {
        initiallySelectedItems.push(item);
      }
    }
    this.selected = initiallySelectedItems;
  }

  remove(item: MultiSelectItem) {
    if (this.single) {
      return;
    }
  
    this.isSelected[item.id] = false;
    
    (this.selected as MultiSelectItem[]).splice(
      this.selectedItemArray().findIndex((_item) => item.id === _item.id),
      1,
    );
    this.finishSelection();
    this.onChange(this.selected);
  }

  selectAll() {
    this.selected = this.allSelected ? [] : [...this.items];
    this.updateSelected();
    this.onChange(this.selected);
  }

  toggleOpen() {
    if (this.selectionDisabled) {
      return;
    }
    this.open = !this.open;
    if (this.open) {
      this.attachDropdown();
    } else {
      this.detachDropDown();
    }
  }

  private attachDropdown() {
    this.cdRef.detectChanges();
    const dropDownEl = this.bodyHost.attach(this.cdkPortal).rootNodes[0];
    interval(10)
      .pipe(
        startWith(null),
        takeUntil(this.closeDropdown$),
        map(() => {
          const rect = this.elementRef.nativeElement.getBoundingClientRect();
          return {top: rect.bottom, left: rect.left, width: rect.width};
        }),
        distinctUntilChanged(equal),
      )
      .subscribe(({top, left, width}) => {
        this.dropDownTop = top;
        this.dropDownLeft = left;
        this.dropDownWidth = width;
        this.maxHeight = Math.min(window.innerHeight - top - 20, 320);
        this.countHeight();
        this.cdRef.detectChanges();
        this.searchInput?.nativeElement.focus();
      });

    this.clickOutsideService
      .onOutsideClickEls([this.elementRef.nativeElement, dropDownEl])
      .pipe(takeUntil(this.destroy$), takeUntil(this.closeDropdown$))
      .subscribe(() => {
        this.open = false;
        this.detachDropDown();
        this.cdRef.detectChanges();
      });
  }

  private detachDropDown() {
    if (this.open) {
      this.open = false;
    }
    this.closeDropdown$.next();
    this.bodyHost.detach();
  }

  ngOnDestroy(): void {
    this.detachDropDown();
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.filterItems();
    this.updateSelected();

    if (this.initiallySelectedItems?.length) {
      this.setInitiallySelectedItems();
    }
      
    this.matchedField = this.items?.find(item => item.id === this.selectedItem);
    if (this.matchedField?.parentItem) {
      this.filteredItems = this.items
        .filter(item => !item.parentItem || 
          (this.matchedField?.parentItem && item.parentItem === this.matchedField?.parentItem));
    } else {
      const firstParentItem = this.items?.find(item => item.parentItem)?.parentItem;
      this.filteredItems = this.items?.filter(item => !item.parentItem || item.parentItem === firstParentItem);
    }

  }

  registerOnChange(fn: (value: MultiSelectItem[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {}

  writeValue(value: MultiSelectItem[] | string): void {
    if (this.single) {
      this.selected = value;
    } else {
      if (typeof value !== 'string') {
        this.selected = (value ? [...value] : []) as MultiSelectItem[];
      }
    }

    this.updateSelected();
  }

  private updateSelected() {
    this.isSelected = {};
    this.selectedItemArray().forEach((item) => (this.isSelected[item.id] = true));
    this.sortSelected();
    this.finishSelection();
  }

  private selectedItemArray(): MultiSelectItem[] {
    if (this.single) {
      return [this.items?.find((item) => item.id === this.selected)].filter(
        Boolean,
      ) as MultiSelectItem[];
    }

    return this.selected as MultiSelectItem[];
  }

  private finishSelection() {
    this.hiddenSelected = this.selectedItemArray().length - this.showLimit;
    this.showSelected = [...this.selectedItemArray()].splice(0, this.showLimit);
    this.allSelected = this.selectedItemArray().length === this.items?.length;
  }

  private sortSelected() {
    this.selected = this.single
      ? this.selected
      : this.selectedItemArray().sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  private filterItems() {
    if (this.hierarchy) {
      this.hiddenItems = {};
      this.filteredItems = [];
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].name.toLowerCase().includes(this.searchControl.value.toLowerCase())) {
          if (this.items[i].parentItem) {
            if (!this.filteredItems.find(item => item.name === this.items[i].parentItem)) {
              this.filteredItems.push(this.items.find(item => item.name === this.items[i].parentItem));
            }
            this.filteredItems.push(this.items[i]);
          } else if (!this.items[i].hasChildren) {
            this.filteredItems.push(this.items[i]);
          }
        }
      }
    } else {
      this.filteredItems =
        this.items?.filter((item) =>
          item.name.toLowerCase().includes(this.searchControl.value.toLowerCase()),
        ) || [];
      this.countHeight();
    }
  }

  private countHeight() {
    this.itemHeight = this.single ? 32 : 42;
    const extraEls = [this.search, !this.single].filter(Boolean);
    this.dropDownHeight = Math.min(
      this.maxHeight,
      (this.filteredItems?.length + extraEls.length) * this.itemHeight +
        extraEls.length * 2 +
        1 +
        (this.search && this.single ? 10 : 1),
    ) + 5;
  }

  private onChange(value: MultiSelectItem[] | string) {}
}
