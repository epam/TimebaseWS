import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { select, Store } from '@ngrx/store';
import { takeUntil, filter } from 'rxjs/operators';
import { Subject }             from 'rxjs';
import { getActiveTabFilters } from '../../../store/streams-tabs/streams-tabs.selectors';
import { FilterModel } from '../../../models/filter.model';
import { AppState }    from '../../../../../core/store';

@Component({
  selector: 'app-modal-filter',
  templateUrl: './modal-filter.component.html',
  styleUrls: ['./modal-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalFilterComponent implements OnInit, OnDestroy {

  title: string;
  closeBtnName: string;
  types: any[] = [];
  symbols: any[] = [];
  dropdownListTypes = [];
  selectedItemsTypes = [];
  dropdownSettingsTypes = {};
  dropdownListSymbols = [];
  selectedItemsSymbols = [];
  dropdownSettingsSymbols = {};
  onFilter: any;
  onClear: any;
  isStream: boolean;
  
  private destroy$ = new Subject();

  constructor(public bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.dropdownListTypes = [...this.types];
    this.dropdownListSymbols = [...this.symbols].map(item => {
      return { name: item };
    });

    this.dropdownSettingsTypes = {
      singleSelection: false,
      idField: 'name',
      textField: 'name',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 10,
      allowSearchFilter: true,
    };

    this.dropdownSettingsSymbols = {
      singleSelection: false,
      idField: 'name',
      textField: 'name',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 10,
      allowSearchFilter: true,
    };

    this.appStore
      .pipe(
        select(getActiveTabFilters),
        filter((filter) => !!filter),
        takeUntil(this.destroy$),
      )
      .subscribe((filter: FilterModel) => {
        if (filter.filter_symbols && filter.filter_symbols.length) {
          this.selectedItemsSymbols = [...filter.filter_symbols];
        } else {
          this.selectedItemsSymbols = [];
        }
        if (filter.filter_types && filter.filter_types.length) {
          this.selectedItemsTypes = [...filter.filter_types];
        } else {
          this.selectedItemsTypes = [];
        }
      });
  }


  onItemSelectTypes(item: any) {
    this.symbolsTypesFilter();
  }

  onItemDeSelectTypes(item: any) {
    this.symbolsTypesFilter();
  }

  onSelectAllTypes(items: any) {
    this.symbolsTypesFilter();
  }

  onDeSelectAllTypes(items: any) {
    this.symbolsTypesFilter();
  }

  onItemSelectSymbols(item: any) {
    this.symbolsTypesFilter();
  }

  onItemDeSelectSymbols(item: any) {
    this.symbolsTypesFilter();
  }

  onSelectAllSymbols(items: any) {
    this.symbolsTypesFilter();
  }

  onDeSelectAllSymbols(items: any) {
    this.symbolsTypesFilter();
  }

  symbolsTypesFilter() {
    setTimeout(() => {

      let filter_symbols = [];
      let filter_types = [];
      if (this.selectedItemsSymbols && this.selectedItemsSymbols.length) {
        filter_symbols = this.selectedItemsSymbols.map(item => {
          return item['name'] || item;
        });
      }
      if (this.selectedItemsTypes && this.selectedItemsTypes.length) {
        filter_types = this.selectedItemsTypes.map(item => {
          return item['name'] || item;
        });
      }
      this.onFilter({
        filter_symbols: filter_symbols,
        filter_types: filter_types,
      });
    }, 350);
  }

  clear() {
    this.selectedItemsSymbols = [];
    this.selectedItemsTypes = [];
    this.cdr.detectChanges();
    this.onClear();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
