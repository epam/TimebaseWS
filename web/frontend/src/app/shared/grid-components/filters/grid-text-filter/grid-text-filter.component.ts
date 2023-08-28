import { ChangeDetectorRef, Component, OnDestroy }   from '@angular/core';
import { UntypedFormControl }                               from '@angular/forms';
import { IFloatingFilterComp }                       from 'ag-grid-angular';
import { FilterChangedEvent, IFloatingFilterParams } from 'ag-grid-community';
import { Subject }                                   from 'rxjs';
import { debounceTime, takeUntil }                   from 'rxjs/operators';
import { GridService }                               from '../../../services/grid.service';
import { GridFiltersService }                        from '../../grid-filters.service';

@Component({
  selector: 'app-grid-text-filter',
  templateUrl: './grid-text-filter.component.html',
  styleUrls: ['./grid-text-filter.component.scss'],
  providers: [GridFiltersService],
})
export class GridTextFilterComponent implements IFloatingFilterComp, OnDestroy {
  
  control = new UntypedFormControl();
  
  private destroy$ = new Subject();
  
  constructor(
    private gridService: GridService,
    private cdRef: ChangeDetectorRef,
    private gridFiltersService: GridFiltersService,
  ) { }
  
  onParentModelChanged(parentModel: any, filterChangedEvent?: FilterChangedEvent): void {
  }
  
  agInit(params: IFloatingFilterParams): void {
    this.control.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$),
    ).subscribe(value => {
      this.gridFiltersService.updateValue(params.column.getId(), value);
    });
    
    this.gridFiltersService.getValue(params.column.getId()).pipe(takeUntil(this.destroy$)).subscribe(value => {
      params.parentFilterInstance((instance: any) => {
        instance.onFloatingFilterChanged('contains', value);
      });
      
      this.control.patchValue(value, {emitEvent: false});
      this.cdRef.detectChanges();
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  clear() {
    this.control.patchValue('');
  }
}
