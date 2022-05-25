import Big from 'big.js';
import { IL2Message, IL2Package, L2MessageSide } from '../l2';
import { ITradingAmount, ITradingAmountRequest } from '../tradingAmount';
import { IAppParameters, IOrder } from './orderBookState';
export interface IOrderBookAction {
    payload: {
        symbol: string;
        side: L2MessageSide;
        exchange: string;
        [key: string]: any;
    };
}
export declare const insertOrderAction: (symbol: string, order: IOrder, price: Big, side: L2MessageSide, exchange: string, numberOfOrders: number) => {
    type: string;
    payload: {
        symbol: string;
        order: IOrder;
        side: L2MessageSide;
        exchange: string;
        price: Big;
        numberOfOrders: number;
    };
};
export declare const updateOrderAction: (symbol: string, order: IOrder, price: Big, side: L2MessageSide, exchange: string, numberOfOrders: number) => {
    type: string;
    payload: {
        symbol: string;
        order: IOrder;
        side: L2MessageSide;
        exchange: string;
        price: Big;
        numberOfOrders: number;
    };
};
export declare const deleteOrderAction: (symbol: string, level: number, side: L2MessageSide, exchange: string) => {
    type: string;
    payload: {
        symbol: string;
        level: number;
        side: L2MessageSide;
        exchange: string;
    };
};
export declare const deleteOrderFromAction: (symbol: string, level: number, side: L2MessageSide, exchange: string) => {
    type: string;
    payload: {
        symbol: string;
        level: number;
        side: L2MessageSide;
        exchange: string;
    };
};
export declare const deleteOrderThroughAction: (symbol: string, level: number, side: L2MessageSide, exchange: string) => {
    type: string;
    payload: {
        symbol: string;
        level: number;
        side: L2MessageSide;
        exchange: string;
    };
};
export declare const snapshotAction: (symbol: string, orders: IOrder[], side: L2MessageSide, exchange: string) => {
    type: string;
    payload: {
        symbol: string;
        orders: IOrder[];
        side: L2MessageSide;
        exchange: string;
    };
};
export declare const tradeAction: (symbol: string, trade: IL2Message, timestamp: number, exchange: string) => {
    type: string;
    payload: {
        symbol: string;
        trade: IL2Message;
        timestamp: number;
        exchange: string;
    };
};
export declare const spawnChannelAction: (channel: string, symbol: string, parameters: IAppParameters, epicType: string) => {
    type: string;
    payload: {
        channel: string;
        epicType: string;
        symbol: string;
        parameters: IAppParameters;
    };
};
export declare const closeChannelAction: (channel: string) => {
    type: string;
    payload: {
        channel: string;
    };
};
export declare const updateChannelParametersAction: (symbol: string, channel: string, parameters: IAppParameters) => {
    type: string;
    payload: {
        symbol: string;
        channel: string;
        parameters: IAppParameters;
    };
};
export declare const subscribeAction: (symbol: string, parameters: IAppParameters, channel: string) => {
    type: string;
    payload: {
        symbol: string;
        parameters: IAppParameters;
        channel: string;
    };
};
/**
 * API
 */
export declare const unsubscribeAction: (symbol: string) => {
    type: string;
    payload: {
        symbol: string;
    };
};
export declare const clearDeletedAction: () => {
    type: string;
};
export declare const recordHoveredAction: (groupId: string, side: L2MessageSide, entity: any) => {
    type: string;
    payload: {
        groupId: string;
        side: L2MessageSide;
        entity: any;
    };
};
export declare const noHoveredRecordsAction: (groupId: string) => {
    type: string;
    payload: {
        groupId: string;
    };
};
export declare const packageAction: (l2Package: IL2Package) => {
    type: string;
    payload: {
        l2Package: IL2Package;
    };
};
export declare const dataHandledAction: (symbol: string) => {
    type: string;
    payload: {
        symbol: string;
    };
};
export declare const aggregateByQuantityAction: (symbol: string) => {
    type: string;
    payload: {
        symbol: string;
    };
};
/**
 * API
 */
export declare const calculateTradingAmountAction: (amount: ITradingAmountRequest) => {
    type: string;
    payload: {
        amount: ITradingAmountRequest;
    };
};
/**
 * API
 */
export declare const tradingAmountAction: (amount: ITradingAmount) => {
    type: string;
    payload: {
        amount: ITradingAmount;
    };
};
export declare enum ELineType {
    quantity = "quantity",
    price = "price",
    exchange = "exchange",
    worst_price = "worst_price"
}
/**
 * API
 */
export declare const lineSelectedAction: (price: Big, quantity: Big, exchange: string | undefined, side: L2MessageSide, type: ELineType) => {
    type: string;
    payload: {
        price: Big;
        quantity: Big;
        side: L2MessageSide;
        type: ELineType;
        exchange: string;
    };
};
