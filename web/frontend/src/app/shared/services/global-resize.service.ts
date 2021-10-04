import { Injectable }                         from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalResizeService {

  private progress$ = new Subject<void>();
  private collapse$ = new ReplaySubject<boolean>(1);
  
  progress() {
    this.progress$.next();
  }
  
  onProgress(): Observable<void> {
    return this.progress$.asObservable();
  }
  
  collapse(state: boolean) {
    this.collapse$.next(state);
  }
  
  onCollapse(): Observable<boolean> {
    return this.collapse$.asObservable();
  }
}
