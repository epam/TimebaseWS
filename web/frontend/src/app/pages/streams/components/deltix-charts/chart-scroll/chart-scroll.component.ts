import { Component, Input, OnChanges, ViewChild, ElementRef, OnDestroy, 
  AfterViewInit, ChangeDetectorRef, OnInit, SimpleChanges } from '@angular/core';
import {fromEvent, Subject} from 'rxjs';
import { skip, takeUntil, filter, take } from 'rxjs/operators';
import { ChartScrollService } from '../../../services/chart-scroll.service';
import { formatHDate } from 'src/app/shared/locale.timezone';
import { GlobalFiltersService } from 'src/app/shared/services/global-filters.service';
import { GlobalFilters } from 'src/app/shared/models/global-filters';
import { StreamsService } from 'src/app/shared/services/streams.service';
import { Store, select } from '@ngrx/store';
import { AppState } from 'src/app/core/store';
import { chartTabNumber } from '../../../store/streams-tabs/streams-tabs.selectors';
import { SymbolsService } from 'src/app/shared/services/symbols.service';
import { StorageService } from 'src/app/shared/services/storage.service';
import { ChartService } from 'src/app/shared/services/chart-service';

@Component({
  selector: 'app-chart-scroll',
  templateUrl: './chart-scroll.component.html',
  styleUrls: ['./chart-scroll.component.scss']
})
export class ChartScrollComponent implements OnChanges, OnInit, OnDestroy, AfterViewInit {
  @Input() selectedRange: { start: string, end: string };
  @Input() streamId: string;
  @Input() symbolName: string;
  @Input() scrollRange: { start: string, end: string, tabId: string, liveData: boolean };
  @Input() symbolList: string[];

  @ViewChild('scrollWrapper') scrollWrapper: ElementRef;
  @ViewChild('scrollInner') scrollInner: ElementRef;
  @ViewChild('scrollTooltip') scrollTooltip: ElementRef;

  tooltipText: string = '';

  private symbolRange: { start: string, end: string, tabId: string, liveData: boolean };
  private symbolRangeInitial: { start: string, end: string, tabId: string, liveData: boolean };
  private symbolRangeStart: number;
  private scrollWrapperElement: HTMLElement;
  private tooltipElement: HTMLElement;
  private chartWidth: number;
  private symbolLength: number;
  private destroy$ = new Subject<void>();
  private hideTooltip = new Subject<void>();
  private sizeRatio: number;
  private newSelectedStart: number;
  private globalFilters: GlobalFilters;
  private dateFormatAccuracy = 1;
  private tooltipShift = 160;
  private lastAppliedRange: { start: string, end: string };
  private scrolledToTheEnd = false;
  private chartTabNumber: number;
  private mouseDown: boolean = false;

  constructor(
    private appStore: Store<AppState>,
    private chartScrollService: ChartScrollService, 
    private cdRef: ChangeDetectorRef,
    private streamsService: StreamsService,
    private symbolService: SymbolsService,
    private storageService: StorageService,
    private globalFiltersService: GlobalFiltersService,
    private chartService: ChartService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.scrollRange?.currentValue && this.selectedRange) {

      this.symbolRangeInitial = changes.scrollRange?.currentValue;
      this.symbolRange = changes.scrollRange?.currentValue;

      this.setChartScroll(this.selectedRange, true);
    }

    if (this.symbolRange?.end && this.selectedRange) {
      const selectedRangeChanged = !this.lastAppliedRange || this.lastAppliedRange.start !== this.selectedRange.start || 
        this.lastAppliedRange.end !== this.selectedRange.end;
        
      if (selectedRangeChanged) {
        let symbolLengthChanged = false;
        if (new Date(this.symbolRangeInitial.end) > new Date(this.selectedRange.end)) {
          this.symbolRange = { ...this.symbolRangeInitial };
          symbolLengthChanged = true;
        }
        this.setChartScroll(this.selectedRange, symbolLengthChanged);
      }

      if (!this.chartService.scrollEnabled) {
        this.scrolledToTheEnd = true;
      }

      if (!this.scrolledToTheEnd && this.symbolList.length === 1) {
        this.scrolledToTheEnd = true;
        const tabIndex = this.storageService.getTabs().findIndex(tab => tab.id === this.symbolRange.tabId);
        const storageKey = `${this.streamId}_${tabIndex}`;
        const savedChartSettings = this.streamsService.getChartSettings(storageKey);
        this.streamsService.removeChartSettings();
        setTimeout(() => {
          if (!savedChartSettings || this.chartTabNumber > savedChartSettings.chartTabNumber) {
            this.goToEnd(this.selectedRange);
          }
        }, 1000);
      }
    }
  }

  ngOnInit() {
    this.globalFiltersService
      .getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe((globalFilters) => {
        this.globalFilters = globalFilters;
      });


    this.appStore
      .pipe(select(chartTabNumber), takeUntil(this.destroy$))
      .subscribe(num => this.chartTabNumber = num);
  }

  ngAfterViewInit() {
    this.scrollWrapperElement = this.scrollWrapper.nativeElement;

    this.tooltipElement = this.scrollTooltip.nativeElement;

    fromEvent(this.scrollWrapperElement, 'mousedown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.mouseDown = true;
        setTimeout(() => {
          if (this.tooltipElement.style.visibility !== 'visible' && this.mouseDown) {
            this.tooltipElement.style.visibility = 'visible';
          }
        }, 200);
      })

    fromEvent(this.scrollWrapperElement, 'mousemove')
      .pipe(takeUntil(this.destroy$), filter(() => !!this.symbolRange?.start))
      .subscribe((event: MouseEvent) => {
        const { left, width } = this.scrollWrapperElement.getBoundingClientRect();

        const ratio = (event.x - left) / width;
        let selectedStart = ratio * this.symbolLength + +new Date(this.symbolRange.start);

        if (this.tooltipElement.style.visibility !== 'visible') {
          this.tooltipElement.style.visibility = 'visible';
        }
        this.showTooltip(selectedStart);
      })

    fromEvent(this.scrollWrapperElement, 'scroll')
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((event: Event) => {
        const targetElement = event.target as HTMLElement;
        this.scrollChart(Math.round(targetElement.scrollLeft), Math.round(targetElement.scrollWidth));
      })

    fromEvent(this.scrollWrapperElement, 'mouseleave')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.tooltipElement.style.visibility === 'visible') {
          this.tooltipElement.style.visibility = 'hidden';
        }
      })

    fromEvent(this.scrollWrapperElement, 'mouseup')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: MouseEvent) => {
        this.mouseDown = false;
        const { left, width } = this.scrollWrapperElement.getBoundingClientRect();

        let selectedStart: number;

          const ratio = (event.x - left) / width;
          selectedStart = ratio * this.symbolLength + +new Date(this.symbolRange.start);
  
          const selectedRangeAsNumber = +new Date(this.selectedRange.start);
          if (Math.abs(selectedRangeAsNumber - this.newSelectedStart) > Math.abs(selectedRangeAsNumber - selectedStart)) {
            selectedStart = this.newSelectedStart;
          }

        this.tooltipElement.style.visibility = 'hidden';
        this.chartScrollService.chartRangeStartUpdated.next({ [`${this.streamId}-${this.symbolName}`]: selectedStart });

        setTimeout(() => {
          const scrollRight = this.scrollWrapperElement.scrollWidth - this.scrollWrapperElement.scrollLeft - this.chartWidth;
          if (scrollRight < 5 || Math.round(scrollRight * 1000 / this.scrollWrapperElement.scrollWidth) < 2) {
            const selectedRangeLength = +new Date(this.selectedRange.end) - +new Date(this.selectedRange.start);
            selectedStart = +new Date(this.symbolRange.end) - selectedRangeLength;
            this.chartScrollService.chartRangeStartUpdated.next({ [`${this.streamId}-${this.symbolName}`]: selectedStart });
          }
        }, 0);
      })
  }

  private setChartScroll(selectedSymbolRange: { start: string, end: string }, symbolLengthChanged = true) {
    this.lastAppliedRange = selectedSymbolRange;

    const selectedRange = +new Date(selectedSymbolRange.end) - +new Date(selectedSymbolRange.start);

    if (symbolLengthChanged && this.scrollWrapperElement && this.scrollInner) {
      this.symbolRangeStart = +new Date(this.symbolRange.start);
      this.symbolLength = +new Date(this.symbolRange.end) - this.symbolRangeStart;
      this.sizeRatio = Math.round(this.symbolLength / selectedRange);

      this.chartWidth = this.scrollWrapperElement.offsetWidth;
      this.scrollInner.nativeElement.style.width = this.chartWidth * this.sizeRatio + 'px';

      let tooltipWidth = 160;
      if (this.symbolLength > 26298e5) {
        this.dateFormatAccuracy = 864e5;
        tooltipWidth = 100;
      } else if (this.symbolLength > 864e5) {
        this.dateFormatAccuracy = 6e4;
        tooltipWidth = 140;
      } else {
        this.dateFormatAccuracy = 1;
      }
      this.tooltipElement.style.width = tooltipWidth + 'px';
      this.tooltipShift = tooltipWidth / 2;
    }

    if (this.symbolLength) {
      const chartLeftScroll = Math.round((+new Date(selectedSymbolRange.start) - this.symbolRangeStart) * 
        this.scrollInner.nativeElement.scrollWidth / this.symbolLength);
      this.scrollWrapperElement.scrollLeft = chartLeftScroll;
    }
  }

  private dateFormat(date: string, periodicity: number): string {
    return formatHDate(
      date,
      this.globalFilters?.dateFormat,
      this.globalFilters?.timeFormat,
      this.globalFilters?.timezone,
      false,
      periodicity
    );
  }

  goToStart() {
    this.newSelectedStart = this.symbolRangeStart;
    this.chartScrollService.chartRangeStartUpdated.next({ [`${this.streamId}-${this.symbolName}`]: this.newSelectedStart });
  }

  goToEnd(selectedRange: { start: string, end: string } = this.lastAppliedRange) {
    this.symbolService.getRanges(this.streamId, this.symbolList)
      .pipe(take(1))
      .subscribe((range: { start: string, end: string }) => {
        const symbolRangeEnd = new Date(range.end) > new Date(this.symbolRange.end) ? range.end : this.symbolRange.end;
        const selectedRangeLength = +new Date(selectedRange.end) - +new Date(selectedRange.start);
        this.newSelectedStart = +new Date(symbolRangeEnd) - selectedRangeLength;
        const newSelectedTimeRange = { 
          start: new Date(this.newSelectedStart).toISOString(),
          end: symbolRangeEnd 
        }
        this.setChartScroll(newSelectedTimeRange, false);
        this.chartScrollService.chartRangeStartUpdated.next({ [`${this.streamId}-${this.symbolName}`]: this.newSelectedStart });
      })
  }

  private scrollChart(scrollLeft: number, scrollWidth: number) {
    if (this.chartWidth && this.sizeRatio) {
      this.newSelectedStart = Math.round(scrollLeft * this.symbolLength / scrollWidth + this.symbolRangeStart);
    }
  }

  private showTooltip(startTime: number) {
    this.tooltipText = this.dateFormat(new Date(startTime).toISOString(), this.dateFormatAccuracy);
    
    let tooltipXCoord = ((startTime - this.symbolRangeStart) * (this.chartWidth)) / this.symbolLength + 48;
  
    tooltipXCoord -= this.tooltipShift;
      
    const maxTooltipXCoord = this.chartWidth + 96 - 2 * this.tooltipShift;
    if (tooltipXCoord < 0) {
      tooltipXCoord = 0;
    } else if (tooltipXCoord > maxTooltipXCoord - 20) {
      tooltipXCoord = maxTooltipXCoord - 20;
    }
    this.tooltipElement.style.left = tooltipXCoord + 'px';  
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.hideTooltip.next();
    this.hideTooltip.complete();
  }
}