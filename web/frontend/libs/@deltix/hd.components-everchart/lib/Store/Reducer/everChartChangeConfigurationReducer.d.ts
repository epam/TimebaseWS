import { everChartChangeConfigurationAction } from '../Actions/everChartActions';
import { IEverChartState } from '../everChartState';
export declare const everChartChangeConfigurationReducer: (state: IEverChartState, { payload: { pads } }: ReturnType<typeof everChartChangeConfigurationAction>) => IEverChartState;
