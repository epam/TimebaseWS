import { Injectable }                from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap, take }      from 'rxjs/operators';
import { GridService }               from '../services/grid.service';
import { TabStorageService }         from '../services/tab-storage.service';

@Injectable()
export class GridFiltersService {
  constructor(
    private gridService: GridService,
  ) {}
  
  storageService(): Observable<TabStorageService<{ [index: string]: unknown }>> {
    return this.gridService.gridStorage().pipe(map(service => service.flow<{ [index: string]: unknown }>('filters')));
  }
  
  updateValue(colId: string, value: unknown) {
    this.storageService().pipe(take(1)).subscribe(service => {
      service.updateDataSync(storage => {
        const result = storage || {};
        result[colId] = value;
        return result;
      });
    });
  }
  
  getValue(colId: string): Observable<unknown> {
    return combineLatest([
      this.storageService().pipe(switchMap(service => service.getData())),
      this.gridService.gridStorage<{ filterOpen: boolean }>().pipe(switchMap(service => service.getData())),
    ]).pipe(map(([filters, storage]) => storage?.filterOpen ? (filters?.[colId] || null) : null));
  }
}
