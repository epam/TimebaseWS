import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute }                                                      from '@angular/router';
import { HdDate }                                                              from '@assets/hd-date/hd-date';
import { select, Store }                                                       from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';
import { BsDatepickerConfig }                                                  from 'ngx-bootstrap/datepicker';
import { BsModalService }                                                      from 'ngx-bootstrap/modal';
import { combineLatest, merge, Observable, of, Subject, throwError }           from 'rxjs';
import {
  catchError,
  debounceTime,
  filter,
  map,
  shareReplay,
  switchMap,
  take,
  takeUntil, tap,
  withLatestFrom,
}                                                                              from 'rxjs/operators';
import { AppState }                                                            from '../../../../core/store';
import { ExportFilterFormat }                                                  from '../../../../shared/models/export-filter';
import { SchemaTypeModel }                                                     from '../../../../shared/models/schema.type.model';
import { RightPaneService }                                                    from '../../../../shared/right-pane/right-pane.service';
import { GlobalFiltersService }                                                from '../../../../shared/services/global-filters.service';
import { SchemaService }                                                       from '../../../../shared/services/schema.service';
import { StreamsService }                                                      from '../../../../shared/services/streams.service';
import { SymbolsService }                                                      from '../../../../shared/services/symbols.service';
import {
  dateToUTC,
  hdDateTZ,
}                                                                              from '../../../../shared/utils/timezone.utils';
import { FilterModel }                                                         from '../../models/filter.model';
import { StreamUpdatesService }                                                from '../../services/stream-updates.service';
import { StreamDetailsEffects }                                                from '../../store/stream-details/stream-details.effects';
import * as fromStreamDetails
                                                                               from '../../store/stream-details/stream-details.reducer';
import * as StreamsTabsActions
                                                                               from '../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
}                                                                              from '../../store/streams-tabs/streams-tabs.selectors';
import { ModalExportFileComponent }                                            from '../modals/modal-export-file/modal-export-file.component';
import { ModalFilterComponent }                                                from '../modals/modal-filter/modal-filter.component';
import { formatHDate } from 'src/app/shared/locale.timezone';

const now = new HdDate();

export const toUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() + new Date().getTimezoneOffset() * 60 * 1000);
  return newDate;
};

export const fromUtc = (date: any) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() - new Date().getTimezoneOffset() * 60 * 1000);
  return newDate;
};

@Component({
  selector: 'app-filters-panel',
  templateUrl: './filters-panel.component.html',
  styleUrls: ['./filters-panel.component.scss'],
})
export class FiltersPanelComponent implements OnInit, OnDestroy {
  @Input() hideTimePicker = false;
  
  hasError = false;
  manuallyChanged$: Observable<boolean>;
  dateTitle$: Observable<string>;
  filteredTypesSymbols$: Observable<boolean>;
  bsConfig$: Observable<Partial<BsDatepickerConfig>>;
  showExportBtn$: Observable<boolean>;
  
  private destroy$ = new Subject();
  private now = new Date();
  private tmpDate$ = new Subject<Date>();
  private selectedDate: string;
  private initialDate$: Observable<string>;
  private schema: SchemaTypeModel[];
  private stream: string;
  
  constructor(
    private appStore: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private modalService: BsModalService,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private streamDetailsEffects: StreamDetailsEffects,
    private cdr: ChangeDetectorRef,
    private globalFiltersService: GlobalFiltersService,
    private streamsService: StreamsService,
    private streamUpdatesService: StreamUpdatesService,
    private symbolsService: SymbolsService,
    private messageInfoService: RightPaneService,
    private schemaService: SchemaService,
  ) {}
  
  ngOnInit() {
    this.activatedRoute.params
      .pipe(switchMap((tab) => {
        this.stream = tab.stream;
        return this.schemaService.getSchema(tab.stream, null, true);
      }))
      .pipe(
        map((response) => [...response.types]),
        takeUntil(this.destroy$),
        catchError((e: HttpErrorResponse) => {
          this.streamsService.nonExistentStreamNavigated.next(this.stream);
          return throwError(e);
        }),
      )
      .subscribe((schema) => (this.schema = schema));
    
    const range$ = this.activatedRoute.params.pipe(
      switchMap((params) =>
        params.symbol
          ? this.symbolsService
            .getProps(params.stream, params.symbol, 1000)
            .pipe(map((p) => p?.props.symbolRange))
          : this.streamsService.getProps(params.stream).pipe(map((p) => p?.props.range)),
      ),
      shareReplay(1),
      catchError(e => {
        this.hasError = true;
        this.cdr.detectChanges();
        return of(null);
      }),
      filter(r => !!r),
    );
    
    this.initialDate$ = this.activatedRoute.params.pipe(
      switchMap(() =>
        combineLatest([
          this.appStore.pipe(
            select(getActiveTab),
            filter((t) => !!t),
          ),
          range$,
        ]),
      ),
      map(([tab, range]) => {
        if (tab.live) {
          return new Date(new Date(range.end).getTime() + 1).toISOString();
        }
        return tab.reverse || tab.monitor ? range?.end : range?.start;
      }),
      map((date) => date || this.now.toISOString()),
    );
    
    const filtersAndInitial$ = combineLatest([
      this.appStore.pipe(
        select(getActiveTabFilters),
        filter((f) => !!f),
      ),
      this.initialDate$,
    ]);
    
    this.dateTitle$ = merge(
      filtersAndInitial$.pipe(
        switchMap(([filters, initial]) => this.utcToDatePicker(filters.from || initial)),
      ),
      this.tmpDate$.pipe(map((date) => date.toISOString())),
    );
    
    this.dateTitle$.pipe(takeUntil(this.destroy$)).subscribe(date => this.selectedDate = date);
    
    const filters$ = this.appStore.pipe(select(getActiveTabFilters));
    this.manuallyChanged$ = filters$.pipe(map((filters) => filters?.manuallyChanged));
    
    this.filteredTypesSymbols$ = filters$.pipe(
      map((filters) => !!(filters?.filter_symbols?.length || filters?.filter_types?.length)),
    );
    
    this.activatedRoute.params
      .pipe(
        tap(() => {
          this.hasError = false;
          this.cdr.detectChanges();
        }),
        switchMap((params) =>
          filtersAndInitial$.pipe(
            take(1),
            map((data) => data),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(([filter, initial]) => {
        if (!filter?.from) {
          this.updateFilters({from: initial});
        }
      });
    
    this.bsConfig$ = this.globalFiltersService.getBsConfig();
    const activeTab$ = this.appStore.pipe(select(getActiveOrFirstTab));
    
    this.showExportBtn$ = activeTab$.pipe(
      filter((t) => !!t),
      map((tab) => !tab.monitor && !tab.live),
    );
    
    this.streamUpdatesService
      .onUpdates()
      .pipe(
        withLatestFrom(activeTab$),
        debounceTime(100),
        switchMap(([updates, activeTab]) => {
          if (updates.changed.includes(activeTab.stream) && activeTab.filter?.filter_symbols) {
            return this.symbolsService.getSymbols(activeTab.stream, activeTab.space);
          }
          
          return of(null);
        }),
        withLatestFrom(activeTab$),
        takeUntil(this.destroy$),
      )
      .subscribe(([updatedSymbols, activeTab]) => {
        if (!updatedSymbols) {
          return;
        }
        
        const newSymbols = activeTab.filter.filter_symbols.filter((symbol) =>
          updatedSymbols.includes(symbol),
        );
        if (newSymbols.length !== activeTab.filter.filter_symbols.length) {
          this.updateFilterSymbols(newSymbols);
        }
      });
  }
  
  onDateSubmit() {
    this.globalFiltersService
      .getFilters()
      .pipe(take(1))
      .subscribe((filters) => {
        this.updateFilters({
          from: dateToUTC(new Date(this.selectedDate), filters.timezone[0].name).toISOString(),
          manuallyChanged: true,
        });
      });
  }
  
  onDateChange(date: Date) {
    this.tmpDate$.next(date);
  }
  
  onClearFilter() {
    this.messageInfoService.clearSelectedMessage();
    this.initialDate$.pipe(take(1)).subscribe((initialDate) => {
      this.updateFilters({from: initialDate, manuallyChanged: false});
    });
  }
  
  private updateFilters(update: Partial<FilterModel>) {
    this.messageInfoService.clearSelectedMessage();
    combineLatest([this.activatedRoute.params, this.appStore.pipe(select(getActiveTabFilters))])
      .pipe(take(1))
      .subscribe(([params, filters]) => {
        this.appStore.dispatch(
          new StreamsTabsActions.SetFilters({
            filter: {...filters, ...update},
            tabId: params.id,
          }),
        );
      });
  }
  
  private utcToDatePicker(date: string): Observable<string> {
    return this.globalFiltersService.getFilters().pipe(
      map((filters) => {
        const newDate = new Date(date);
        const offset = newDate.getTimezoneOffset() + filters.timezone[0].offset;
        newDate.setMilliseconds(newDate.getMilliseconds() + offset * 60 * 1000);
        return newDate.toISOString();
      }),
    );
  }
  
  openFilterModalWithComponent() {
    this.appStore
      .pipe(select(getActiveTab))
      .pipe(take(1))
      .subscribe((tab) => {
        const initialState = {
          title: 'Symbols & Message Types Filter',
          types: this.schema,
          isStream: !tab.symbol,
          closeBtnName: 'Close',
          stream: tab.stream,
          symbol: tab.symbol,
          space: tab.space,
        };
        
        const bsModalRef = this.modalService.show(ModalFilterComponent, {
          initialState,
          class: 'modal-filter',
        });
        this.messageInfoService.clearSelectedMessage();
        bsModalRef.content.onFilter = (data) => {
          this.updateFilters({filter_types: data.filter_types?.length ? data.filter_types : null});
          this.updateFilterSymbols(data.filter_symbols);
        };
        
        bsModalRef.content.onClear = () => {
          this.messageInfoService.clearSelectedMessage();
          this.updateFilters({filter_symbols: null, filter_types: null});
        };
      });
  }
  
  export() {
    this.appStore
      .pipe(select(getActiveOrFirstTab))
      .pipe(take(1))
      .subscribe((tab) => {
        const initialState = {
          stream: {id: tab.stream, name: tab.stream},
          exportFormat: ExportFilterFormat.QSMSG,
          symbols: tab.symbol ? [tab.symbol] : tab.filter.filter_symbols,
          types: tab.filter.filter_types,
        };
        
        if (tab.reverse) {
          initialState['initialRangeEnd'] = tab.filter.from;
        } else {
          initialState['initialRangeStart'] = tab.filter.from;
        }
        
        this.modalService.show(ModalExportFileComponent, {
          initialState,
          class: 'scroll-content-modal',
        });
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  
  private updateFilterSymbols(filterSymbols: string[]) {
    this.updateFilters({filter_symbols: filterSymbols?.length ? filterSymbols : null});
    this.messageInfoService.clearSelectedMessage();
  }
}
