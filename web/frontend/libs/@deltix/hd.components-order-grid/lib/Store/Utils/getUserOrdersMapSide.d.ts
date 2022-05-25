import { L2MessageSide } from '@deltix/hd.components-order-book';
import { IGridOrder, IUserOrder, IUserOrdersMapSide } from '../orderGridState';
export declare const getUserOrdersMapSide: (mapExchangeCode: boolean, side: L2MessageSide, records: IGridOrder[], aggregationPrice: number, userOrders: IUserOrder[]) => IUserOrdersMapSide;
