import { IEverChartPad } from '../Store/everChartParams';
import { IEverChartDataItem } from '../Store/everChartState';
export declare const getMinMax: (pad: IEverChartPad, data: IEverChartDataItem[], startTime: number, endTime: number, height: number) => {
    min: number;
    max: number;
};
