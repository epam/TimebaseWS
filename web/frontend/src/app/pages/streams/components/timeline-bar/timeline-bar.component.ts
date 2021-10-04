import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { HdDate }        from '@assets/hd-date/hd-date';
import { select, Store } from '@ngrx/store';

import { combineLatest, Observable, Subject }           from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { AppState }                                     from '../../../../core/store';
import { formatHDate }                                  from '../../../../shared/locale.timezone';
import { GlobalFilters }                                from '../../../../shared/models/global-filters';
import { GlobalFiltersService }                         from '../../../../shared/services/global-filters.service';
import { TabModel }                                     from '../../models/tab.model';
import * as FilterActions                               from '../../store/filter/filter.actions';
import { streamProps }                                  from '../../store/stream-props/stream-props.selectors';
import { getActiveOrFirstTab, getActiveTabFilters }     from '../../store/streams-tabs/streams-tabs.selectors';

@Component({
  selector: 'app-timeline-bar',
  templateUrl: './timeline-bar.component.html',
  styleUrls: ['./timeline-bar.component.scss'],
})
export class TimelineBarComponent implements OnInit, OnDestroy {
  @ViewChild('timebarCursor', {static: true}) timebarCursor: ElementRef;
  activeTab$: Observable<TabModel>;
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
  ) { }
  
  ngOnInit() {
    this.globalFiltersService.getFilters().pipe(takeUntil(this.destroy$)).subscribe(filter => this.filter = filter);
    
    const currentDate$ = this.appStore.pipe(
      select(getActiveTabFilters),
      map(filters => filters?.from),
      distinctUntilChanged(),
    );
    
    const range$ = this.appStore.pipe(
      select(streamProps),
      map(props => props?.range),
      filter(r => !!r),
      distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
    );
    
    combineLatest([currentDate$, range$]).pipe(takeUntil(this.destroy$)).subscribe(([filter, range]) => {
      const current = filter || range.start;
      this.startTime = (new Date(range.start)).getTime();
      const endTime = (new Date(range.end)).getTime();
      const currentTime = (new Date(current)).getTime();
      this.unixTimeLength = endTime - this.startTime;
      const percent = ((currentTime - this.startTime) / this.unixTimeLength);
      this.cursorPosSet = Math.max(Math.min(percent, 1), 0);
      this.barLengthPercent = this.cursorPosSet * 100;
      this.cdRef.detectChanges();
    });
    
    this.activeTab$ = this.appStore.pipe(select(getActiveOrFirstTab));
    
    this.appStore
      .pipe(
        select(getActiveOrFirstTab),
        filter(tab => !!tab),
        takeUntil(this.destroy$),
      )
      .subscribe((tab: TabModel) => this.reverse = tab.hasOwnProperty('reverse'));
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
    this.appStore.dispatch(new FilterActions.AddFilters({filter: {from: this.timebarCursorTitle}}));
  }
  
  private updateCursorTitle(position: number) {
    const timestampDiff = this.unixTimeLength * position;
    this.timebarCursorTitle = (new HdDate(this.startTime + timestampDiff)).toISOString();
    this.timebarCursorTitleVisible = formatHDate(this.timebarCursorTitle, this.filter.dateFormat, this.filter.timeFormat, this.filter.timezone);
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
}
