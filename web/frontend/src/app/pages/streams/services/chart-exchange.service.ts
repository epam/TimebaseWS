import {Injectable }                         from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChartExchangeService {
  private manuallyChanged$ = new Subject<void>();
  
  manuallyChanged() {
    this.manuallyChanged$.next();
  }
  
  onManuallyCHanged(): Observable<void> {
    return this.manuallyChanged$.asObservable();
  }
}
