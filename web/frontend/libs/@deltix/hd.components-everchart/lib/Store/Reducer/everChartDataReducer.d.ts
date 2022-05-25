import { everChartDataAction } from '../Actions/everChartActions';
import { IEverChartState } from '../everChartState';
export declare const everChartDataReducer: (state: IEverChartState, { payload: { data, interval } }: ReturnType<typeof everChartDataAction>) => IEverChartState;
