import { Injectable }    from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { RowsLoadInfo }  from '../../models/rows-load-info';

@Injectable()
export class GridTotalService {
  private rowsLoadInfo$ = new ReplaySubject<RowsLoadInfo>(1);
  private time: number;
  
  startLoading() {
    this.time = new Date().getTime();
  }
  
  endLoading(dataLength: number) {
    this.rowsLoadInfo$.next({number: dataLength, time: new Date().getTime() - this.time});
    this.time = 0;
  }
  
  loadedFromCache(dataLength: number) {
    this.rowsLoadInfo$.next({number: dataLength, time: 0});
  }
  
  onRowsLoadingInfo() {
    return this.rowsLoadInfo$.asObservable();
  }
}
