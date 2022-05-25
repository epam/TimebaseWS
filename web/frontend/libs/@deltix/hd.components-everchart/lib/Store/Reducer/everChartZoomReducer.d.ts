import { everChartZoomAction } from '../Actions/everChartActions';
import { IEverChartState } from '../everChartState';
export declare const everChartZoomReducer: (state: IEverChartState, { payload: { zoom } }: ReturnType<typeof everChartZoomAction>) => IEverChartState;
