import { IDepthChardReducerParameters, IDepthChartAppState } from '../depthChartState';
export declare const depthChartReducer: ({ parameters, formatFunctions, symbol, }: IDepthChardReducerParameters) => (state: IDepthChartAppState, action: import("redux").AnyAction) => IDepthChartAppState;
