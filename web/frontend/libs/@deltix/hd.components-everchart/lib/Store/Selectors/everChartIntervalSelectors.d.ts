import { IEverChartBaseItem } from '../everChartParams';
import { IEverChartPadState, IEverChartState } from '../everChartState';
interface IChartInterval {
    color: number;
    x: number;
    open: number;
    close: number;
    low: number;
    high: number;
    intervalWidth: number;
    alpha: number;
}
export declare const selectEverChartIntervals: (state: IEverChartState, pad: IEverChartPadState, padItem: IEverChartBaseItem) => IChartInterval[];
export {};
