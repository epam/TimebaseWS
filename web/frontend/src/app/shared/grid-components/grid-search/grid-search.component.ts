import { Component, HostListener, OnDestroy }       from '@angular/core';
import { IHeaderAngularComp }                       from 'ag-grid-angular';
import { IAfterGuiAttachedParams, IHeaderParams }   from 'ag-grid-community';
import { Observable, ReplaySubject, combineLatest } from 'rxjs';
import { map, switchMap, take, takeUntil }          from 'rxjs/operators';
import { GridService }                              from '../../services/grid.service';

@Component({
  selector: 'app-grid-search',
  templateUrl: './grid-search.component.html',
  styleUrls: ['./grid-search.component.scss'],
})
export class GridSearchComponent implements IHeaderAngularComp, OnDestroy {
  
  highLight$: Observable<boolean>;
  tooltip$: Observable<string>;
  
  private destroy$ = new ReplaySubject(1);
  
  @HostListener('click') click() {
    this.gridService.gridStorage<{ filterOpen: boolean }>().pipe(
      switchMap(service => service.updateData(storage => ({filterOpen: !storage?.filterOpen}))),
      take(1),
    ).subscribe();
  }
  
  constructor(
    private gridService: GridService,
  ) { }
  
  afterGuiAttached(params?: IAfterGuiAttachedParams): void {
  }
  
  agInit(params: IHeaderParams): void {
    const open$ = this.gridService.gridStorage<{ filterOpen: boolean }>().pipe(
      switchMap(service => service.getData()),
      map(storage => !!storage?.filterOpen),
    );
    
    open$.pipe(takeUntil(this.destroy$)).subscribe(
      open => params.api.setFloatingFiltersHeight(open ? 40 : 0),
    );
    
    this.tooltip$ = open$.pipe(map(open => `gridFilters.iconTooltip.${open ? 'hide' : 'show'}`));
    
    this.highLight$ = combineLatest([
      open$,
      this.gridService.gridStorage().pipe(switchMap(service => service.flow('filters').getData())),
    ]).pipe(map(([open, filters]) => open && Object.keys(filters || {}).some(key => !!filters[key])));
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
