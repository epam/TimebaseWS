import { IEverChartBaseItem } from '../everChartParams';
import { IEverChartPadState, IEverChartState } from '../everChartState';
interface IVolume {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare const selectEverChartVolumes: (s: IEverChartState, pad: IEverChartPadState, padItem: IEverChartBaseItem) => IVolume[];
export {};
