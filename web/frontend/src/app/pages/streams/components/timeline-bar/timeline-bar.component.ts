import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {HdDate} from '@assets/hd-date/hd-date';
import {select, Store} from '@ngrx/store';
import equal from 'fast-deep-equal/es6';

import {combineLatest, Subject} from 'rxjs';
import {distinctUntilChanged, filter, map, switchMap, take, takeUntil} from 'rxjs/operators';
import {AppState} from '../../../../core/store';
import {formatHDate} from '../../../../shared/locale.timezone';
import {GlobalFilters} from '../../../../shared/models/global-filters';
import {GlobalFiltersService} from '../../../../shared/services/global-filters.service';
import {StreamsService} from '../../../../shared/services/streams.service';
import {SymbolsService} from '../../../../shared/services/symbols.service';
import {TabModel} from '../../models/tab.model';
import * as StreamsTabsActions from '../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveOrFirstTab,
  getActiveTabFilters,
} from '../../store/streams-tabs/streams-tabs.selectors';

@Component({
  selector: 'app-timeline-bar',
  templateUrl: './timeline-bar.component.html',
  styleUrls: ['./timeline-bar.component.scss'],
})
export class TimelineBarComponent implements OnInit, OnDestroy {
  @ViewChild('timebarCursor', {static: true}) timebarCursor: ElementRef;
  barLengthPercent: number;
  unixTimeLength: number;
  startTime: number;
  timebarCursorTitleVisible: string;
  cursorTop = 0;
  reverse: boolean;

  private timebarCursorTitle: string;
  private destroy$ = new Subject();
  private cursorPos: number;
  private cursorPosSet = 0;
  private filter: GlobalFilters;

  constructor(
    private appStore: Store<AppState>,
    private globalFiltersService: GlobalFiltersService,
    private cdRef: ChangeDetectorRef,
    private streamsService: StreamsService,
    private symbolsService: SymbolsService,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.globalFiltersService
      .getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe((filter) => (this.filter = filter));

    const currentDate$ = this.appStore.pipe(
      select(getActiveTabFilters),
      map((filters) => filters?.from),
      distinctUntilChanged(),
    );

    const routeChanged$ = this.activatedRoute.params.pipe(
      map(({id}) => id),
      distinctUntilChanged(),
    );

    const range$ = routeChanged$.pipe(
      switchMap(() => this.appStore.pipe(select(getActiveOrFirstTab), take(1))),
      switchMap((tab) => {
        return tab.symbol
          ? this.symbolsService
              .getProps(tab.stream, tab.symbol, 1000)
              .pipe(map((p) => p?.props.symbolRange))
          : this.streamsService.getProps(tab.stream).pipe(map((p) => p?.props.range));
      }),
      filter((r) => !!r),
      distinctUntilChanged(equal),
    );

    combineLatest([currentDate$, range$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([filter, range]) => {
        const current = filter || range.start;
        this.startTime = new Date(range.start).getTime();
        const endTime = new Date(range.end).getTime();
        const currentTime = new Date(current).getTime();
        this.unixTimeLength = endTime - this.startTime;
        const percent = (currentTime - this.startTime) / this.unixTimeLength;
        this.cursorPosSet = Math.max(Math.min(percent, 1), 0);
        this.barLengthPercent = this.cursorPosSet * 100;
        this.cdRef.detectChanges();
      });

    this.appStore
      .pipe(
        select(getActiveOrFirstTab),
        filter((tab) => !!tab),
        takeUntil(this.destroy$),
      )
      .subscribe((tab: TabModel) => (this.reverse = tab.hasOwnProperty('reverse')));
  }

  onMouseMove(event: MouseEvent) {
    const barHeight = (event.currentTarget as HTMLDivElement).offsetHeight;
    const offsetY = Math.max(0, Math.min(event.offsetY, barHeight));
    this.cursorPos = offsetY / barHeight;
    this.updateCursorTitle(this.cursorPos);
    this.cursorTop = offsetY;
  }

  onSetCursor() {
    this.updateCursorTitle(this.cursorPosSet);
    combineLatest([this.activatedRoute.params, this.appStore.pipe(select(getActiveTabFilters))])
      .pipe(take(1))
      .subscribe(([params, filters]) => {
        this.appStore.dispatch(
          new StreamsTabsActions.SetFilters({
            filter: {...filters, ...{from: this.timebarCursorTitle, manuallyChanged: true}},
            tabId: params.id,
          }),
        );
      });
  }

  public onSetDate(event: MouseEvent) {
    event.stopPropagation();
    this.cursorPosSet = this.cursorPos;
    this.onSetCursor();
  }

  timebarPlus() {
    this.cursorPosSet = Math.min(this.cursorPosSet + 0.1, 1);
  }

  timebarMinus() {
    this.cursorPosSet = Math.max(this.cursorPosSet - 0.1, 0);
  }

  timebarTop() {
    if (!this.reverse) {
      this.timebarMinus();
    } else {
      this.timebarPlus();
    }
    this.onSetCursor();
  }

  timebarBottom() {
    if (!this.reverse) {
      this.timebarPlus();
    } else {
      this.timebarMinus();
    }
    this.onSetCursor();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private updateCursorTitle(position: number) {
    const timestampDiff = this.unixTimeLength * position;
    this.timebarCursorTitle = new HdDate(this.startTime + timestampDiff).toISOString();
    this.timebarCursorTitleVisible = formatHDate(
      this.timebarCursorTitle,
      this.filter.dateFormat,
      this.filter.timeFormat,
      this.filter.timezone,
    );
  }
}
