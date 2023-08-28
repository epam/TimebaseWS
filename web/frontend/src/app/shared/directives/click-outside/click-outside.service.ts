import {Injectable} from '@angular/core';
import {fromEvent, Subject} from 'rxjs';
import {filter} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ClickOutsideService {
  private documentClick$ = new Subject<HTMLElement>();

  constructor() {
    fromEvent(document, 'click').subscribe((event) =>
      this.documentClick$.next(event.target as HTMLElement),
    );
  }

  onOutsideClick(target: HTMLElement) {
    return this.onOutsideClickEls([target]);
  }

  onOutsideClickEls(targets: HTMLElement[]) {
    return this.documentClick$.pipe(
      filter((clicked) => {
        let el = clicked;
        while (el) {
          if (targets.includes(el)) {
            return false;
          }
          el = el.parentElement;
        }

        return true;
      }),
    );
  }
}
