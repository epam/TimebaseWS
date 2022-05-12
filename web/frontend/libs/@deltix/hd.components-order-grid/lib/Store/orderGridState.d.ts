import { IFormat } from '@deltix/hd.components-common';
import { IInputState, IViewportState } from '@deltix/hd.components-multi-app';
import { IGridData, IOrderGridParameters, IUserOrder } from '@deltix/hd.components-order-grid-common';
import Big from 'big.js';
export interface IOrderGridReducerParameters {
    symbol: string;
    quantityPrecision: number;
    pricePrecision: number;
    termCode: string;
    showExchange: boolean;
    mapExchangeCode: boolean;
    formatFunctions: IFormatFunctions;
    parameters: IOrderGridParameters;
}
export interface IUserOrdersMapSide {
    [key: string]: Big;
}
export interface IUserOrdersMap {
    buy: IUserOrdersMapSide;
    sell: IUserOrdersMapSide;
}
export interface IHighlightOrders {
    buy: string;
    sell: string;
}
export interface IFormatFunctions {
    price: IFormat;
    quantity: IFormat;
    spread: IFormat;
}
export interface IOrderGridAppState {
    symbol: string;
    formatFunctions: IFormatFunctions;
    buy: IGridData;
    sell: IGridData;
    spread: Big;
    parameters: IOrderGridParameters;
    quantityPrecision: number;
    pricePrecision: number;
    termCode: string;
    userOrders: IUserOrder[];
    userOrdersMap: IUserOrdersMap;
    showExchange: boolean;
    mapExchangeCode: boolean;
    aggregatingPrice: boolean;
    aggregatingQuantity: boolean;
    highlightOrders: IHighlightOrders;
}
export interface IOrderGridState {
    app: IOrderGridAppState;
    input: IInputState;
    viewport: IViewportState;
}
export { IOrderGridParameters, IUserOrder, IGridData, IGridOrder, } from '@deltix/hd.components-order-grid-common';
