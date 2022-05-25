import { IEverChartPadState, IEverChartState } from '../Store/everChartState';
export declare const usePadSelector: <T>(selector: (s: IEverChartState, pad: IEverChartPadState) => T, pad: IEverChartPadState) => T;
