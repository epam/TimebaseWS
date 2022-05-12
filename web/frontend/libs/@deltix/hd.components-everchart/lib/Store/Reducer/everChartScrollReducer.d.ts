import { everChartScrollToTimeAction } from '../Actions/everChartActions';
import { IEverChartState } from '../everChartState';
export declare const everChartScrollReducer: (state: IEverChartState, { payload: { scroll } }: ReturnType<typeof everChartScrollToTimeAction>) => IEverChartState;
