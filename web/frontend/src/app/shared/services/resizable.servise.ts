import { Injectable, OnDestroy } from '@angular/core';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ResizableService implements OnDestroy {

  childModalOpen = false;
  parentResizeDisabled = new Subject<boolean>();
  windowResized = new Subject<void>();

  private destroy$ = new Subject();

  constructor() {
    fromEvent(window, 'resize')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.windowResized.next());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}