import { IEqualPriceRecord, IOrder } from "../orderBookState";
export declare const logOrder: (order: IOrder) => string;
export declare const logEqualPriceRecord: (equalPriceRecord: IEqualPriceRecord, orders: IOrder[]) => string;
