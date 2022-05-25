import {Injectable} from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalResizeService {
  private collapse$ = new ReplaySubject<boolean>(1);

  collapse(state: boolean) {
    this.collapse$.next(state);
  }

  onCollapse(): Observable<boolean> {
    return this.collapse$.asObservable();
  }
}
