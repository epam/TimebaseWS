import { everChartChangeViewportAction } from '../Actions/everChartActions';
import { IEverChartState } from '../everChartState';
export declare const everChartChangeViewportReducer: (state: IEverChartState, { payload: { viewport } }: ReturnType<typeof everChartChangeViewportAction>) => IEverChartState;
