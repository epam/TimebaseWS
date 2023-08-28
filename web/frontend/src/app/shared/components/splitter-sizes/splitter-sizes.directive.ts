import {
  AfterContentInit,
  ContentChildren,
  Directive,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  QueryList,
  SimpleChanges,
  SkipSelf,
} from '@angular/core';
import {StorageMap} from '@ngx-pwa/local-storage';
import {SplitAreaDirective, SplitComponent} from 'angular-split';
import {merge, Observable, of, ReplaySubject, timer} from 'rxjs';
import {delay, distinctUntilChanged, map, switchMap, take, takeUntil} from 'rxjs/operators';
import {ResizeObserveService} from '../../services/resize-observe.service';

@Directive({
  selector: '[appSplitterSizes]',
})
export class SplitterSizesDirective implements AfterContentInit, OnDestroy, OnChanges {
  @ContentChildren(SplitAreaDirective) areas: QueryList<SplitAreaDirective>;
  @Input() appSplitterSizes: number[];
  @Input() fixSizes: number[];
  @Input() minSizes: number[];
  @Input() parentWidthAddon = 0;
  @Input() storageKey: string;
  @Input() useStorage = true;
  @Input() parentMinSize = 0;

  @HostBinding('style.min-width.px') private minWidth: number;
  @HostBinding('class.hidden') private hidden: boolean;

  private destroy$ = new ReplaySubject(1);
  private lastSizes: number[];
  private parentAreaIndex: number;
  private childMinWidth: {[index: number]: number} = {};
  private dragging: boolean;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private splitComponent: SplitComponent,
    private resizeObserveService: ResizeObserveService,
    private localStorage: StorageMap,
    @Optional() private parentArea: SplitAreaDirective,
    @Optional() @SkipSelf() private parentSplitterSizes: SplitterSizesDirective,
  ) {}

  ngAfterContentInit(): void {
    if (this.useStorage) {
      this.hidden = true;
    }

    this.splitComponent.dragStart
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.dragging = true));
    this.splitComponent.dragEnd.pipe(takeUntil(this.destroy$)).subscribe(({sizes}) => {
      this.lastSizes = sizes as number[];
      this.dragging = false;
      if (this.storageKey) {
        this.getStorageValue()
          .pipe(
            switchMap((value) => {
              const data = value || {};
              data[this.storageKey] = sizes as number[];
              return this.localStorage.set('resizerSizes', data);
            }),
            take(1),
          )
          .subscribe();
      }
    });

    this.resizeObserveService
      .observe(this.elementRef.nativeElement)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.recountPercents();
      });

    const childResizes = Array.from(this.elementRef.nativeElement.children).map((child) =>
      this.resizeObserveService.observe(child as HTMLElement),
    );

    merge(...childResizes)
      .pipe(
        map(() => this.areas.map((area) => area.visible)),
        distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.recountPercents());

    if (this.parentSplitterSizes) {
      timer().subscribe(() => {
        this.parentSplitterSizes.areas.forEach((area, index) => {
          if (area === this.parentArea) {
            this.parentAreaIndex = index;
            this.recountPercents();
          }
        });
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.storageKey) {
      this.getSizes()
        .pipe(take(1), delay(0))
        .subscribe((sizes) => {
          this.lastSizes = sizes;
          this.recountPercents();
          this.hidden = false;
        });
    }

    if (changes.appSplitterSizes && this.areas) {
      this.recountPercents();
    }

    if (changes.fixSizes && this.areas) {
      this.recountPercents();
    }
  }

  setChildMinSize(index: number, size: number) {
    this.childMinWidth[index] = size;

    if (!this.dragging) {
      this.recountPercents();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.parentAreaIndex !== undefined) {
      this.parentSplitterSizes.setChildMinSize(this.parentAreaIndex, 0);
    }
  }

  private recountPercents() {
    const minSizes = this.minSizes.map((size, index) =>
      Math.max(this.pixelToPercent(size), this.pixelToPercent(this.childMinWidth[index] || 0)),
    );

    this.minWidth =
      this.minSizes.reduce((acc, s, index) => {
        if (this.areas.get(index).visible) {
          const min = this.fixSizes && this.fixSizes[index] ? this.fixSizes[index] : s;
          return acc + (this.childMinWidth[index] || min);
        }

        return acc;
      }, 0) + 11;

    if (this.parentAreaIndex !== undefined) {
      this.parentSplitterSizes.setChildMinSize(
        this.parentAreaIndex,
        Math.max(this.parentMinSize, this.minWidth + this.parentWidthAddon),
      );
    }

    const sizes = this.appSplitterSizes.map((size, index) => {
      let currentSize = this.lastSizes ? this.lastSizes[index] : size;
      let isMin = currentSize < minSizes[index];
      if (this.fixSizes) {
        currentSize = this.fixSizes[index] ? this.pixelToPercent(this.fixSizes[index]) : null;
        isMin = false;
        if (this.fixSizes[index]) {
          minSizes[index] = 0;
        }
      }
      return {isMin, size: currentSize !== null ? Math.max(currentSize, minSizes[index]) : null};
    });

    const nullSizeIndex = sizes.findIndex((data) => data.size === null);
    if (nullSizeIndex > -1) {
      const notNullSize = sizes[nullSizeIndex === 0 ? 1 : 0];
      sizes[nullSizeIndex].size = 100 - notNullSize.size;
    }

    if (sizes.reduce((acc, data) => acc + data.size, 0) > 100) {
      const adjustedIndex = sizes.findIndex((d) => d.isMin);
      sizes[adjustedIndex === 0 ? 1 : 0].size = 100 - sizes[adjustedIndex].size;
    }

    minSizes.forEach((minSize, index) => {
      const area = this.areas.get(index);
      area.size = sizes[index].size;
      area.minSize = minSize;
    });
  }

  private pixelToPercent(pixel: number): number {
    return (pixel / (this.elementRef.nativeElement.offsetWidth - 11)) * 100;
  }

  private getSizes(): Observable<number[]> {
    return this.getStorageValue().pipe(
      map((value) => {
        return value ? value[this.storageKey] : null;
      }),
    );
  }

  private getStorageValue(): Observable<{[index: string]: number[]}> {
    if (!this.storageKey) {
      return of(null);
    }

    return this.localStorage.get('resizerSizes') as Observable<{[index: string]: number[]}>;
  }
}
