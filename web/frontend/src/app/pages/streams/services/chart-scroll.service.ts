import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChartScrollService {

  chartRangeStartUpdated = new Subject<{ [key: string]: number }> ();
  selectedTimeRange = new Subject();

  private symbolRanges: { [symbolKey: string]: { end: string, start: string }} = {};

  constructor() {}

  setSymbolRange(symbolKey: string, range: { end: string, start: string }) {
    this.symbolRanges = {
        ...this.symbolRanges,
        [symbolKey]: range
    }
  }

  getSymbolRange(symbolKey: string) {
    return this.symbolRanges[symbolKey];
  }
}