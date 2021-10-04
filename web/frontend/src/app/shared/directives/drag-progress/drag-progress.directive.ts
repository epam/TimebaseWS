import { Directive, OnInit, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { SplitComponent }                                            from 'angular-split';
import { interval, merge, ReplaySubject }                            from 'rxjs';
import { switchMap, takeUntil }                                      from 'rxjs/operators';

@Directive({
  selector: '[appDragProgress]',
})
export class DragProgressDirective implements OnInit, OnDestroy {
  
  @Output() appDragProgress = new EventEmitter<void>();
  @Input() progressInterval = 50;
  
  private destroy$ = new ReplaySubject<void>(1);
  
  constructor(private splitComponent: SplitComponent) {
  }
  
  ngOnInit() {
    merge(
      this.splitComponent.dragStart.pipe(switchMap(() => interval(this.progressInterval).pipe(takeUntil(this.splitComponent.dragEnd)))),
      this.splitComponent.dragEnd,
    ).pipe(takeUntil(this.destroy$)).subscribe(() => this.appDragProgress.emit());
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
