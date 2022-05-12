import { IDepthChartParameters } from '@deltix/hd.components-depth-chart-common';
import { IOrderBook } from '@deltix/hd.components-order-book';
import { IDepthChartState } from '../depthChartState';
export declare const createDepthChartEpic: (orderBook: IOrderBook, symbol: string, parameters: IDepthChartParameters, channel: string, appId: string) => import("redux-observable").Epic<import("redux").AnyAction, import("redux").Action<any>, IDepthChartState, any>;
