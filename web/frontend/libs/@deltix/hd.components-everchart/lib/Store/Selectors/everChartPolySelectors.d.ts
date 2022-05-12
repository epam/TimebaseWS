import * as PIXI from 'pixi.js';
import { IEverChartBaseItem } from '../everChartParams';
import { IEverChartPadState, IEverChartState } from '../everChartState';
export declare const selectEverChartMin: (s: IEverChartState, pad: IEverChartPadState, next?: boolean) => number;
export declare const selectEverChartMax: (s: IEverChartState, pad: IEverChartPadState, next?: boolean) => number;
export declare const selectEverChartWidth: (s: IEverChartState, pad: IEverChartPadState) => number;
export declare const selectEverChartHeight: (s: IEverChartState, pad: IEverChartPadState) => number;
export declare const selectEverChartPoly: (state: IEverChartState, pad: IEverChartPadState, padItem: IEverChartBaseItem) => PIXI.IPoint[][];
interface IArea {
    points: number[];
    isForward: boolean;
}
export declare const selectEverChartRangeAreaPoly: (state: IEverChartState, pad: IEverChartPadState, padItem: IEverChartBaseItem) => IArea[];
export {};
