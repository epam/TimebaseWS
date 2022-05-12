import { everChartHistoryDataAction } from '../Actions/everChartActions';
import { IEverChartState } from '../everChartState';
export declare const everChartHistoryDataReducer: (state: IEverChartState, { payload: { data, time, interval, end }, }: ReturnType<typeof everChartHistoryDataAction>) => IEverChartState;
