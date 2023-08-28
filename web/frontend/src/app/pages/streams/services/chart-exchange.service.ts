import {Injectable, OnDestroy, OnInit}                         from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import {distinctUntilChanged, filter, map, take, takeUntil}    from 'rxjs/operators';
import {TabStorageService} from '../../../shared/services/tab-storage.service';

@Injectable()
export class ChartExchangeService {
 private manuallyChanged$ = new Subject<void>();
 
 manuallyChanged() {
   this.manuallyChanged$.next();
 }
 
 onManuallyCHanged(): Observable<void> {
   return this.manuallyChanged$.asObservable();
 }
}
