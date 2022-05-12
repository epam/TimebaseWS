import { everChartNewIntervalAction } from '../Actions/everChartActions';
import { IEverChartState } from '../everChartState';
export declare const everChartCleanReducer: (state: IEverChartState, { payload: { interval } }: ReturnType<typeof everChartNewIntervalAction>) => IEverChartState;
