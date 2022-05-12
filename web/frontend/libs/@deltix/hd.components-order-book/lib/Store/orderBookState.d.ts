import { EAggregationTypes } from '@deltix/hd.components-common';
import Big from 'big.js';
import { L2Action } from '../l2';
export interface IAppParameters {
    groupId?: string;
    aggregation?: {
        [EAggregationTypes.price]?: number;
        [EAggregationTypes.quantity]?: number;
    };
}
export interface ISubscriptionParameter {
    channels: string[];
    value: number;
}
export interface IRecord {
    id: string;
    price: Big;
    quantity: Big;
    worstPrice?: Big;
    numberOfOrders?: number;
}
export interface IOrder {
    id: string;
    quantity: Big;
    price?: Big;
    equalPriceRecord?: IEqualPriceRecord;
    level: number;
    exchange: string;
    action: L2Action;
    numberOfOrders?: number;
}
export interface IEqualPriceRecord extends IRecord {
    orders: IOrder[];
}
export interface IAggregatedPriceRecord extends IRecord {
    equalPriceRecords: IEqualPriceRecord[];
}
export interface IAggregatedQuantityRecord extends IRecord {
    worstPrice?: Big;
}
export interface IData {
    records: IRecord[];
    deleted: string[];
}
export interface IEqualPriceData extends IData {
    records: IEqualPriceRecord[];
}
export interface IAggregatedPriceData extends IData {
    records: IAggregatedPriceRecord[];
}
export interface IAggregatedQuantityData extends IData {
    records: IAggregatedQuantityRecord[];
}
export interface ISubscriptionSide {
    snapshotHandled: {
        [exchangeId: string]: boolean;
    };
    aggregated: {
        [EAggregationTypes.price]: {
            equal: IEqualPriceData;
            [aggregationPrice: number]: IAggregatedPriceData;
        };
        [EAggregationTypes.quantity]: {
            [aggregationQuantity: number]: IAggregatedQuantityData;
        };
    };
    orders: {
        [exchange: string]: IOrder[];
    };
}
export interface IOrderBookState {
    subscriptions: {
        [symbol: string]: ISubscription;
    };
}
export interface IAggregationParameters {
    [EAggregationTypes.price]: ISubscriptionParameter[];
    [EAggregationTypes.quantity]: ISubscriptionParameter[];
}
export interface ISubscriptionParameters {
    aggregation: IAggregationParameters;
}
export interface ISubscription {
    parameters: ISubscriptionParameters;
    buy: ISubscriptionSide;
    sell: ISubscriptionSide;
}
