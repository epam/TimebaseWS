import { EAggregationTypes } from '@deltix/hd.components-common';
import Big from 'big.js';
export declare const orderGridEpicType = "orderGridEpicType";
export interface IOrderGridParameters {
    groupId?: string;
    aggregation?: {
        [EAggregationTypes.price]?: number;
        [EAggregationTypes.quantityTotalPrice]?: number;
        [EAggregationTypes.quantityAveragePrice]?: number;
    };
    splitView?: boolean;
    inverseSplitView?: boolean;
    abbreviations?: boolean;
}
export interface IUserOrder {
    symbol: string;
    side: L2MessageSide;
    quantity: Big;
    price: Big;
    exchange: string;
}
export declare enum L2MessageSide {
    buy = "buy",
    sell = "sell"
}
export interface IGridData {
    orders: IGridOrder[];
    deleted: string[];
}
export interface ISideDataAggregated {
    price: {
        equal: IGridData;
        [price: number]: IGridData;
    };
    quantity: {
        [qty: number]: IGridData;
    };
}
export interface ISideData {
    aggregated: ISideDataAggregated;
}
export interface IGridOrder {
    id: string;
    price: Big;
    quantity: Big;
    exchange: string | undefined;
    level: number | undefined;
    worstPrice?: Big;
    orderCount?: number;
}
