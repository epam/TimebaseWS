import {Injectable} from '@angular/core';
import { fromEvent } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

const allFocusableElementsSelector = 'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

@Injectable({
  providedIn: 'root',
})
export class TabNavigationService {

  private allFocusableElements: HTMLElement[];
  public lastFocusableElement: HTMLElement;

  constructor() {}

  public addNavigationEventListeners() {
    fromEvent (document, 'keydown')
    .pipe(
      filter((event: KeyboardEvent) => ['Tab', 'ArrowUp', 'ArrowDown'].includes(event.key)),
      tap(() => this.setLastFocusableElement()),
      filter((event: KeyboardEvent) => event.key === 'Tab' && event.target === this.lastFocusableElement),
    )
    .subscribe(event => {
      event.preventDefault();
      this.focusFirstFocusableElement();
    })
  
    fromEvent(document, 'click').subscribe(() => this.setLastFocusableElement());
  }

  public setLastFocusableElement() {
    this.allFocusableElements = Array.from(document.querySelectorAll(allFocusableElementsSelector));
    this.lastFocusableElement = this.allFocusableElements[this.allFocusableElements.length - 1];
  }

  public focusFirstFocusableElement(container?: HTMLElement) {
    const allFocusableElements = container ? Array.from(container.querySelectorAll(allFocusableElementsSelector))
      : this.allFocusableElements;
    (allFocusableElements[0] as HTMLElement).focus();
  }
}
