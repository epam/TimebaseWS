import { IEverChartDataBlock, IEverChartDataItem } from '../Store/everChartState';
export declare const appendTimeSeries: <T extends IEverChartDataItem = IEverChartDataItem>(data: IEverChartDataBlock<T>[], newData: T[], interval: number | null | undefined, initialTime: number | null, endTime?: number, blockSize?: number) => IEverChartDataBlock<T>[];
