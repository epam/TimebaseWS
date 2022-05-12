import { everChartLastTimeAction } from '../Actions/everChartActions';
import { IEverChartState } from '../everChartState';
export declare const everChartLastTimeReducer: (state: IEverChartState, { payload: { lastTime } }: ReturnType<typeof everChartLastTimeAction>) => IEverChartState;
