import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StreamsNavigationScrollService {
  private scrollToActiveMenu$ = new Subject<void>();

  scrollToActiveMenu() {
    this.scrollToActiveMenu$.next();
  }

  onScrollToActiveMenu(): Observable<void> {
    return this.scrollToActiveMenu$.asObservable();
  }
}
