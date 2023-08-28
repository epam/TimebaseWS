import { Injectable } from '@angular/core';
import { fromEvent, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EscapeKeyService {

  public escapeKeyPressed$ = new BehaviorSubject(false);

  constructor() {
    fromEvent(document, 'keydown').subscribe((event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.escapeKeyPressed$.next(true);
      } 
    });
  }
}
