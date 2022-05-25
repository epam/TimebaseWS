import { L2MessageSide } from '@deltix/hd.components-order-book';
import Big from 'big.js';
import { IOrderGridParameters, ISideData, IUserOrder } from './common';
export declare const updateGridAction: (buy: ISideData, sell: ISideData, spread: Big) => {
    type: string;
    payload: {
        buy: ISideData;
        sell: ISideData;
        spread: Big;
    };
};
/**
 * API
 */
export declare const updateUserOrdersAction: (userOrders: IUserOrder[]) => {
    type: string;
    payload: {
        userOrders: IUserOrder[];
    };
};
/**
 * API
 */
export declare const updateParametersAction: (parameters: IOrderGridParameters) => {
    type: string;
    payload: {
        parameters: IOrderGridParameters;
    };
};
export declare const highlightOrderAction: (groupId: string, side: L2MessageSide, entity: any) => {
    type: string;
    payload: {
        groupId: string;
        side: L2MessageSide;
        entity: any;
    };
};
export declare const noOrderToHighlightAction: (groupId: string) => {
    type: string;
    payload: {
        groupId: string;
    };
};
export declare const orderHoveredAction: (side: L2MessageSide, entity: any) => {
    type: string;
    payload: {
        side: L2MessageSide;
        entity: any;
    };
};
