import { Injectable }    from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { RowsLoadInfo }  from '../../models/rows-load-info';

@Injectable()
export class GridTotalService {
  private rowsLoadInfo$ = new ReplaySubject<RowsLoadInfo>(1);
  private time: number;
  private lastStartTime: number;
  private lastEndTime: number;
  
  startLoading(grid = false) {
    if (!grid || new Date().getTime() - this.lastStartTime > 1000) {
      this.time = new Date().getTime();
      this.lastStartTime = this.time;
    }
  }
  
  endLoading(dataLength: number, grid = false) {
    if (!grid || new Date().getTime() - this.lastEndTime > 1000) {
      this.rowsLoadInfo$.next({ number: dataLength, time: new Date().getTime() - this.time + 1, 
        fromCache: grid && new Date().getTime() - this.lastEndTime > 1000 });
      this.lastEndTime = new Date().getTime();
      this.time = 0;
    }
  }
  
  loadedFromCache(dataLength: number) {
    this.rowsLoadInfo$.next({ number: dataLength, time: new Date().getTime() - this.time + 1, fromCache: true });
    this.time = 0;
    this.lastEndTime = new Date().getTime();
  }
  
  onRowsLoadingInfo() {
    return this.rowsLoadInfo$.asObservable();
  }
}
