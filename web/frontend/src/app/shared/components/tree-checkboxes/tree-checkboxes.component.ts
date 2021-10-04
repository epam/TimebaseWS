import { Component, forwardRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR }                      from '@angular/forms';
import { ReplaySubject }                                                             from 'rxjs';
import { takeUntil }                                                                 from 'rxjs/operators';
import { TreeItem }                                                                  from './tree-item';

@Component({
  selector: 'app-tree-checkboxes',
  templateUrl: './tree-checkboxes.component.html',
  styleUrls: ['./tree-checkboxes.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => TreeCheckboxesComponent),
    },
  ],
})
export class TreeCheckboxesComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  
  @Input() tree: TreeItem[];
  @Input() globalFilter: boolean;
  
  selected: { [index: string]: boolean } = {};
  filterControl = new FormControl();
  globalState: Partial<TreeItem>;
  
  private destroy$ = new ReplaySubject(1);
  
  ngOnChanges(changes: SimpleChanges) {
    this.recursive(this.tree, (item, prev) => {
      item.parent = prev;
      return item;
    });
    this.updateValue();
  }
  
  ngOnInit(): void {
    this.filterControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      const searchVal = search.toLowerCase();
      this.recursive(this.tree, item => {
        const match = item.name.toLowerCase().includes(searchVal);
        item.hiddenBySearch = !match;
        if (match) {
          this.forParents(item, parent => parent.hiddenBySearch = false);
        }
      });
    });
  }
  
  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  
  writeValue(values: string[]): void {
    this.selected = {};
    (values || []).forEach(value => this.selected[value] = true);
    this.updateValue();
  }
  
  toggleItemShowChildren(item: TreeItem) {
    item.showChildren = !item.showChildren;
    this.checkGlobalState();
  }
  
  toggleItem(item: Partial<TreeItem>, isGlobal = false) {
    this.onTouched();
    item.partialChecked = false;
    item.checked = !item.checked;
    this.recursive(isGlobal ? this.tree : item.children, child => {
      child.checked = item.checked;
      child.partialChecked = false;
    });
    this.checkParents(item.parent);
    this.checkGlobalState();
    this.emitChanges();
  }
  
  globalExpand() {
    this.globalState.showChildren = !this.globalState.showChildren;
    this.tree.forEach(item => item.showChildren = this.globalState.showChildren);
  }
  
  private emitChanges() {
    const values = [];
    this.recursive(this.tree, (item, prev) => {
      if (!item.children?.length && item.checked) {
        values.push(item.id);
      }
    });
    this.onChange(values);
  }
  
  private updateValue() {
    this.recursive(this.tree, item => {
      item.checked = this.selected[item.id];
      if (!item.children?.length) {
        this.checkParents(item);
      }
    });
    this.checkGlobalState();
  }
  
  private checkGlobalState() {
    const checkedState = this.getCheckedState(this.tree);
    this.globalState = {
      checked: checkedState?.checked,
      partialChecked: checkedState?.partialChecked,
      showChildren: !this.tree.some(item => !item.showChildren),
    };
  }
  
  private forParents(item: TreeItem, callback: (item: TreeItem) => void) {
    if (!item) {
      return;
    }
    
    callback(item);
    this.forParents(item.parent, callback);
  }
  
  private checkParents(item: TreeItem) {
    this.forParents(item, parent => {
      const checkedState = this.getCheckedState(parent.children);
  
      if (checkedState) {
        parent.checked = checkedState.checked;
        parent.partialChecked = checkedState.partialChecked;
      }
    });
  }
  
  private getCheckedState(items: TreeItem[]): {checked: boolean, partialChecked: boolean} {
    if (!items?.length) {
      return null;
    }
    
    const checkedLength = items.filter(child => child.checked).length;
    return {
      checked: checkedLength === items.length,
      partialChecked: checkedLength && checkedLength !== items.length,
    };
  }
  
  private recursive(items: TreeItem[], beforeChildren: (item: TreeItem, prev) => unknown, prev = null) {
    items?.forEach(item => {
      const previous = beforeChildren(item, prev);
      if (item.children?.length) {
        this.recursive(item.children, beforeChildren, previous);
      }
    });
  }
  
  private onChange(value: string[]) {
  }
  
  private onTouched() {
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
