import { Component, OnInit }             from '@angular/core';
import { combineLatest, Observable, Subject, BehaviorSubject }     from 'rxjs';
import { map, take, takeUntil, filter, switchMap }                     from 'rxjs/operators';
import { LinearChartService, StoredRGB, lineColorType } from '../../services/linear-chart.service';
import { Store, select } from '@ngrx/store';
import { AppState } from 'src/app/core/store';
import { getActiveTab } from 'src/app/pages/streams/store/streams-tabs/streams-tabs.selectors';
import { TabModel } from 'src/app/pages/streams/models/tab.model';

@Component({
  selector: 'app-chart-settings',
  templateUrl: './chart-settings.component.html',
  styleUrls: ['./chart-settings.component.scss'],
})
export class ChartSettingsComponent implements OnInit {
  
  lineList: { id: string, title: string, color: string, shown: boolean }[];
  anyChecked$: Observable<boolean>;
  partialChecked$: Observable<boolean>;
  selectAllTitle$: Observable<string>;
  initialColorsChanged = new BehaviorSubject(false);
  private initialColors: lineColorType[];
  private stream: string;

  private destroy$ = new Subject();
  
  constructor(
    private appStore: Store<AppState>,
    private linearChartService: LinearChartService
  ) { }
  
  ngOnInit(): void {

  this.appStore.pipe(
    select(getActiveTab), 
    filter(tab => !!tab.stream),
    switchMap((tab: TabModel) => {
      this.stream = tab.stream;
      return combineLatest([
        this.linearChartService.showLines(),
        this.linearChartService.linesAndColor(),
      ])
    }),
    takeUntil(this.destroy$))
    .subscribe(([showLines, {colors, lines}]) => {
      this.lineList = lines.map(lineKey => ({
        id: lineKey,
        shown: showLines.includes(lineKey),
        color: 'rgb(' + colors[lineKey].join(',') + ')',
        title: lineKey,
      }));

      if (!this.initialColors?.length) {
        this.initialColors = lines.map(lineKey => ({
          id: lineKey, color: 'rgb(' + colors[lineKey].join(',') + ')', changed: false
        }))
      }
    })
    

    this.linearChartService.getInitialColors(this.stream).pipe(
      filter(colors => !!colors?.length),
      takeUntil(this.destroy$)
    ).subscribe((colors: lineColorType[]) => {
      this.initialColors = colors;
      this.initialColorsChanged.next(colors.some(color => color.changed));
    })
    
    this.anyChecked$ = this.linearChartService.showLines().pipe(map(lines => !!lines.length));
    this.partialChecked$ = combineLatest([
      this.linearChartService.linesAndColor(),
      this.linearChartService.showLines(),
    ]).pipe(map(([ {lines}, showLines]) => showLines.length && lines.length > showLines.length));
    
    this.selectAllTitle$ = this.anyChecked$.pipe(map(anyChecked => `chartSettings.${anyChecked ? 'deSelectAll' : 'selectAll'}`));
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  
  toggleLine(item: { id: string; title: string; color: string }) {
    this.linearChartService.toggleLine(item.id);
  }

  resetColors() {
    const changedLineColors = this.initialColors
      .filter(lineColor => lineColor.changed)
      .map(lineColor => {
        const [match, r, g, b] = [...lineColor.color.matchAll(/rgb\((.*),(.*),(.*)\)/g)][0];
        return { line: lineColor.id, color: [Number(r), Number(g), Number(b)] as StoredRGB };
      })

    this.linearChartService.resetLineColors(changedLineColors).pipe(take(1)).subscribe();

    this.initialColors = this.initialColors.map(lineColor => ({...lineColor, changed: false}));
    this.linearChartService.saveInitialColors(this.stream, this.initialColors);
    this.initialColorsChanged.next(false);
  }
  
  onColorChange(value: string, itemId: string) {
    if (!value.startsWith('rgba')) {
      const {r, g, b} = this.hexToRgb(value);

      const colorHasNotChanged = !!this.initialColors
        .find(lineColor => lineColor.color === `rgb(${r},${g},${b})` && lineColor.id === itemId);
      if (colorHasNotChanged) {
        return;
      }

      this.linearChartService.setLineColor(itemId, [r, g, b])
        .pipe(take(1))
        .subscribe(() => this.setInitialColorsChanged(itemId));
    } else {
      const [match, r, g, b, a] = [...value.matchAll(/rgba\((.*),(.*),(.*),(.*)\)/g)][0];
      this.linearChartService.setLineColor(itemId, [Number(r), Number(g), Number(b), Number(a)])
        .pipe(take(1))
        .subscribe(() => this.setInitialColorsChanged(itemId));
    }
  }

  setInitialColorsChanged(itemId: string) {
    const changedLineColorIndex = this.initialColors.findIndex(color => color.id === itemId);
    this.initialColors[changedLineColorIndex].changed = true;
    this.linearChartService.saveInitialColors(this.stream, this.initialColors);
    this.initialColorsChanged.next(true);
  }
  
  hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  }
  
  toggleAll(state: boolean) {
    this.anyChecked$.pipe(
      take(1),
    ).subscribe((anyChecked) => this.linearChartService.toggleAll(!anyChecked));
  }
}
