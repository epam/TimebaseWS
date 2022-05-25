import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ResizeObserveService {
  observe(el: HTMLElement): Observable<void> {
    return new Observable<void>((source) => {
      const resizeObserver = new ResizeObserver(() => source.next());
      resizeObserver.observe(el);
      return () => resizeObserver.unobserve(el);
    });
  }
}
