import { everChartExtremumAction } from '../Actions/everChartActions';
import { IEverChartState } from '../everChartState';
export declare const everChartExtremumReducer: (state: IEverChartState, { payload: { extremums } }: ReturnType<typeof everChartExtremumAction>) => IEverChartState;
