import { Observable } from 'rxjs';
import { IEverChartDataItem } from '../Store/everChartState';
export interface IEverChartFeedOptions {
    pads: Record<string, string[]>;
    interval: number;
}
export interface IEverChartFeedHistoryOptions extends IEverChartFeedOptions {
    fromTime?: number;
    count?: number;
    toTime?: number;
}
export interface IEverChartFeed<T extends IEverChartDataItem = IEverChartDataItem> {
    subscribe(options: IEverChartFeedOptions): Observable<T[]>;
    request(options: IEverChartFeedHistoryOptions): Observable<T[]>;
}
