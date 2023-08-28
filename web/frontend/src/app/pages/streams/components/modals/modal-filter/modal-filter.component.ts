import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {UntypedFormControl} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {merge, Observable, Subject} from 'rxjs';
import {filter, takeUntil, map} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {SymbolsService} from '../../../../../shared/services/symbols.service';
import {FilterModel} from '../../../models/filter.model';
import {getActiveTabFilters} from '../../../store/streams-tabs/streams-tabs.selectors';

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
  dropdownListSymbols$: Observable<{id: string; name: string}[]>;
  onFilter: any;
  onClear: any;
  isStream: boolean;
  symbolsControl = new UntypedFormControl([]);
  typesControl = new UntypedFormControl([]);
  stream: string;
  symbol: string;
  space: string;

  private destroy$ = new Subject();

  constructor(
    public bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private symbolsService: SymbolsService,
  ) {}

  ngOnInit() {
    this.dropdownListTypes = this.types.map((t) => ({name: t.name, id: t.name}));

    this.dropdownListSymbols$ = this.symbolsService
      .getSymbols(this.stream, this.space)
      .pipe(map((symbols) => symbols.map((s) => ({name: s, id: s}))));

    merge(this.symbolsControl.valueChanges, this.typesControl.valueChanges)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.symbolsTypesFilter());

    this.appStore
      .pipe(
        select(getActiveTabFilters),
        filter((filter) => !!filter),
        takeUntil(this.destroy$),
      )
      .subscribe((filter: FilterModel) => {
        this.symbolsControl.patchValue(
          filter.filter_symbols?.map((s) => ({name: s, id: s})) || [],
          {
            emitEvent: false,
          },
        );
        this.typesControl.patchValue(filter.filter_types?.map((s) => ({name: s, id: s})) || [], {
          emitEvent: false,
        });
      });
  }

  symbolsTypesFilter() {
    setTimeout(() => {
      this.onFilter({
        filter_symbols: this.symbolsControl.value?.map((item) => item.id) || [],
        filter_types: this.typesControl.value?.map((item) => item.id) || [],
      });
    }, 350);
  }

  clear() {
    this.symbolsControl.patchValue([]);
    this.typesControl.patchValue([]);
    this.cdr.detectChanges();
    this.onClear();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
