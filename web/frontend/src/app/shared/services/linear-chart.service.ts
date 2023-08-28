import { Injectable, OnDestroy }                                       from '@angular/core';
import { StorageMap }                                                  from '@ngx-pwa/local-storage';
import equal                                                                         from 'fast-deep-equal/es6';
import { BehaviorSubject, Observable, combineLatest, ReplaySubject, of }             from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, switchMap, take, takeUntil, pluck } from 'rxjs/operators';
import { TabStorageService }                                                         from './tab-storage.service';

export type StoredRGB = [number, number, number] | [number, number, number, number];

export interface StoredColors {
  colors: StoredColorsMap;
  storedIndex: number;
}

export interface lineColorType {
  id: string,
  color: string,
  changed: boolean,
}

export interface StoredColorsMap {
  [index: string]: StoredRGB;
}

@Injectable({
  providedIn: 'root',
})
export class LinearChartService implements OnDestroy {
  
  private startPoint = [0, 100, 70];
  private colorIndex = 0;
  private predefined = {
    open: [0, 128, 0],
    close: [220, 0, 0],
  };
  
  private lines$ = new BehaviorSubject([]);
  private flowStorageService: TabStorageService<{ hiddenLines: string[] }>;
  private initialColorsService: TabStorageService<{ [streamKey: string]: lineColorType[] }>;
  private destroy$ = new ReplaySubject(1);
  
  constructor(
    private storageMap: StorageMap,
    private tabStorageService: TabStorageService<unknown>,
  ) {
    this.flowStorageService = this.tabStorageService.flow<{ hiddenLines: string[] }>('lines');
    this.initialColorsService = this.tabStorageService.flow<{ [streamKey: string]: lineColorType[] }>(`lineColors`);
    this.lines$.pipe(
      switchMap(lines => this.updateColors(storage => {
        const data: StoredColorsMap = storage?.colors || {};
        const result = {};
        this.colorIndex = storage?.storedIndex || 0;
        lines.forEach(line => {
          result[line] = data[line] || this.predefined[line.match(/\[(.+)\]/)?.[1]] || this.randomColor();
          data[line] = result[line];
        });
        
        return {colors: data, storedIndex: this.colorIndex};
      })),
      takeUntil(this.destroy$),
    ).subscribe();
  }
  
  setLines(lines: string[]) {
    this.lines$.next(lines);
  }
  
  toggleLine(line: string) {
    this.flowStorageService.updateDataSync(storage => {
      const hiddenLines = storage?.hiddenLines || [];
      if (hiddenLines.includes(line)) {
        hiddenLines.splice(hiddenLines.findIndex(e => e === line), 1);
      } else {
        hiddenLines.push(line);
      }
      
      return {hiddenLines};
    });
  }
  
  toggleAll(state: boolean) {
    const hiddenLines$ = state ? of([]) : this.lines();
    hiddenLines$.pipe(take(1)).subscribe(hiddenLines => this.flowStorageService.updateDataSync(() => ({hiddenLines})));
  }
  
  lines(): Observable<string[]> {
    return this.lines$.asObservable();
  }
  
  showLines(): Observable<string[]> {
    return combineLatest([
      this.flowStorageService.getData(),
      this.lines$,
    ]).pipe(map(([storage, lines]) => lines.filter(line => !(storage?.hiddenLines || []).includes(line))));
  }

  saveInitialColors(streamKey: string, colors: lineColorType[]) {
    this.initialColorsService.updateDataSync(savedColors => ({ ...savedColors, [streamKey]: colors }));
  }

  getInitialColors(streamKey: string) {
    return this.initialColorsService.getData().pipe(pluck(streamKey));
  }
  
  setLineColor(line: string, colors: StoredRGB): Observable<void> {
    return this.updateColors(storage => {
      storage.colors[line] = colors;
      return {colors: storage.colors};
    }).pipe(mapTo(null));
  }

  resetLineColors(lineColors: {line: string, color: StoredRGB}[]): Observable<void> {
    return this.updateColors(storage => {
      for (let lineColor of lineColors) {
        storage.colors[lineColor.line] = lineColor.color;
      }
      return {colors: storage.colors};
    }).pipe(mapTo(null));
  }
  
  colors(): Observable<StoredColorsMap> {
    return this.storageMap.watch('lines-colors').pipe(
      map(storage => storage['colors']),
      distinctUntilChanged(equal),
    );
  }
  
  showLinesAndColors(): Observable<{ colors: StoredColorsMap, showLines: string[] }> {
    return combineLatest([this.colors(), this.showLines()]).pipe(
      filter(([colors, showLines]) => !showLines.find(l => !colors[l])),
      map(([colors, showLines]) => ({colors, showLines})),
    );
  }
  
  linesAndColor(): Observable<{ colors: StoredColorsMap, lines: string[] }> {
    return combineLatest([this.colors(), this.lines()]).pipe(
      filter(([colors, lines]) => !lines.find(l => !colors[l])),
      map(([colors, lines]) => ({colors, lines})),
    );
  }
  
  linearId(line: string): string {
    return `LINEAR[${line}]`;
  }
  
  randomColor() {
    const color = [...this.startPoint];
    const colorIndex = this.colorIndex % 480;
    const uPositionI = Math.floor(colorIndex / 6) % 4;
    const uPositionK = colorIndex % 6;
    const sPosition = Math.floor(colorIndex / 24) % 5;
    const lPosition = Math.floor(colorIndex / 120) % 4;
    
    const lValue = lPosition > 1 ? 1 - lPosition : lPosition;
    
    color[0] += uPositionI * 20 + uPositionK * 60;
    color[1] -= sPosition * 20;
    color[3] += lValue * 20;
    
    this.colorIndex++;
    return this.hSLToRGB(...color as [number, number, number]);
  }
  
  hSLToRGB(h: number, s: number, l: number) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private updateColors(callback: (storage: StoredColors) => Partial<StoredColors>) {
    return this.storageMap.get('lines-colors').pipe(
      switchMap((storage: StoredColors) => {
        const data = callback(storage);
        return this.storageMap.set('lines-colors', {...storage, ...data}).pipe(map(() => data));
      }),
    );
  }
}
