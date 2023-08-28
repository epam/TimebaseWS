import { Component, OnDestroy }                      from '@angular/core';
import { UntypedFormControl }                               from '@angular/forms';
import { TranslateService }                          from '@ngx-translate/core';
import { IFloatingFilterComp }                       from 'ag-grid-angular';
import { FilterChangedEvent, IFloatingFilterParams } from 'ag-grid-community';
import { Observable, ReplaySubject }                 from 'rxjs';
import { map, takeUntil }                            from 'rxjs/operators';
import { GridFiltersService }                        from '../../grid-filters.service';

@Component({
  selector: 'app-grid-dropdown-filter',
  templateUrl: './grid-dropdown-filter.component.html',
  styleUrls: ['./grid-dropdown-filter.component.scss'],
  providers: [GridFiltersService],
})
export class GridDropdownFilterComponent implements IFloatingFilterComp, OnDestroy {
  
  list$: Observable<{ id: string, name: string }[]>;
  control = new UntypedFormControl(null);
  
  private destroy$ = new ReplaySubject(1);
  
  constructor(
    private gridFiltersService: GridFiltersService,
    private translateService: TranslateService,
  ) { }
  
  agInit(params: IFloatingFilterParams): void {
    this.list$ = this.translateService.get('gridFilters.dropdown.all').pipe(
      map(nullTranslation => [{id: null, name: nullTranslation}, ...params['list']]),
    );
    
    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.gridFiltersService.updateValue(params.column.getId(), value);
    });
    
    this.gridFiltersService.getValue(params.column.getId()).pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.control.patchValue(value, {emitEvent: false});
      params.parentFilterInstance((instance: any) => {
        instance.onFloatingFilterChanged('equals', value);
      });
    });
  }
  
  onParentModelChanged(parentModel: any, filterChangedEvent?: FilterChangedEvent): void {
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
