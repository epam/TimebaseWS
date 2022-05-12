import { everChartTickAction } from '../Actions/everChartActions';
import { IEverChartState } from '../everChartState';
export declare const everChartTickReducer: (state: IEverChartState, { payload: { tick } }: ReturnType<typeof everChartTickAction>) => IEverChartState;
