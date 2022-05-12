import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ClickOutsideService} from '../../directives/click-outside/click-outside.service';

interface SelectItem {
  id: string;
  name: string;
}

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
export class MultiSelectComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  @Input() items: {name: string; id: string}[];
  @Input() placeholder: string;
  open: boolean;
  searchControl = new FormControl('');
  isSelected: {[index: string]: boolean} = {};
  selected: SelectItem[] = [];
  showSelected: SelectItem[] = [];
  hiddenSelected = 0;
  filteredItems = [];
  allSelected: boolean;
  @ViewChild(CdkVirtualScrollViewport) private cdkVirtualScrollViewPort: CdkVirtualScrollViewport;
  private destroy$ = new Subject();
  private showLimit = 10;

  constructor(
    private clickOutsideService: ClickOutsideService,
    private elementRef: ElementRef<HTMLElement>,
    private cdRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.clickOutsideService
      .onOutsideClick(this.elementRef.nativeElement)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.open = false;
        this.cdRef.detectChanges();
      });

    this.searchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.filterItems();
    });
  }

  onClick(item: SelectItem) {
    this.isSelected[item.id] = !this.isSelected[item.id];
    if (this.isSelected[item.id]) {
      this.selected.push(item);
      this.sortSelected();
      this.finishSelection();
    } else {
      this.remove(item);
    }

    this.onChange(this.selected);
  }

  remove(item: SelectItem) {
    this.selected.splice(
      this.selected.findIndex((_item) => item.id === _item.id),
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
    this.open = !this.open;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.filterItems();
  }

  registerOnChange(fn: (value: SelectItem[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {}

  writeValue(value: SelectItem[]): void {
    this.selected = value ? [...value] : [];
    this.updateSelected();
  }

  private updateSelected() {
    this.isSelected = {};
    this.selected.forEach((item) => (this.isSelected[item.id] = true));
    this.sortSelected();
    this.finishSelection();
  }

  private finishSelection() {
    this.hiddenSelected = this.selected.length - this.showLimit;
    this.showSelected = [...this.selected].splice(0, this.showLimit);
    this.allSelected = this.selected.length === this.items.length;
  }

  private sortSelected() {
    this.selected = this.selected.sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  private filterItems() {
    this.filteredItems = this.items.filter((item) =>
      item.name.toLowerCase().includes(this.searchControl.value.toLowerCase()),
    );
  }

  private onChange(value: SelectItem[]) {}
}
