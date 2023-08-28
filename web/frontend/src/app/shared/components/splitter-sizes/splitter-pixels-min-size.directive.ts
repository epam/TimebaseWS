import { Directive, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { SplitAreaDirective, SplitComponent }                        from 'angular-split';
import { BehaviorSubject, combineLatest, ReplaySubject, timer }      from 'rxjs';
import { debounceTime, takeUntil }                                   from 'rxjs/operators';
import { ResizeObserveService }                                      from '../../services/resize-observe.service';

@Directive({
  selector: '[appSplitterPixelsMinSize]',
})
export class SplitterPixelsMinSizeDirective implements OnInit, OnDestroy {
  
  @Input() set appSplitterPixelsMinSize(minSize: number) {
    this.minSize$.next(minSize);
  }
  
  @Input() set splitterSize(size: number) {
    this.size$.next(size);
  }
  
  @Output() minSize = new EventEmitter<number>();
  
  private minSize$ = new BehaviorSubject(0);
  private size$ = new BehaviorSubject(50);
  private destroy$ = new ReplaySubject(1);
  
  constructor(
    private splitArea: SplitAreaDirective,
    private split: SplitComponent,
    private resizeObserveService: ResizeObserveService,
  ) { }
  
  ngOnInit(): void {
    const splitEl: HTMLElement = this.split['elRef'].nativeElement;
    combineLatest([
      this.minSize$,
      this.size$,
      this.resizeObserveService.observe(splitEl),
    ]).pipe(takeUntil(this.destroy$), debounceTime(100)).subscribe(([minSize, size]) => {
      const rect: ClientRect = splitEl.getBoundingClientRect();
      const splitSizeInPx = this.split.direction === 'vertical' ? rect.height : rect.width;
      const area = this.split.displayedAreas.find(area => area.component === this.splitArea);
      const otherAreas = this.split.displayedAreas.filter(area => area.component !== this.splitArea);
      area.minSize = (minSize / (splitSizeInPx - otherAreas.length * 11)) * 100;
      const sizeValue = Math.max(size, area.minSize);
      if (sizeValue !== area.size) {
        area.size = sizeValue;
        otherAreas.filter(oArea => {
          oArea.size = (100 - area.size) / otherAreas.length;
        });
      }
      this.split.updateArea(area.component, false, false);
      otherAreas.forEach(oArea => {
        this.split.updateArea(oArea.component, false, false);
      });
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
}
