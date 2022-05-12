import { everChartCrosshairAction } from '../Actions/everChartActions';
import { IEverChartState } from '../everChartState';
export declare const everChartCrosshairReducer: (state: IEverChartState, { payload: { crosshair } }: ReturnType<typeof everChartCrosshairAction>) => IEverChartState;
