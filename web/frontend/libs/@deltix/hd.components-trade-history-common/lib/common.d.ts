import { L2MessageSide } from '@deltix/hd.components-order-book';
import Big from 'big.js';
export declare const tradeHistoryEpicType = "tradeHistory";
export interface ITrade {
    side: L2MessageSide;
    price: Big;
    quantity: Big;
    time: number;
    id: number;
    exchange: string;
}
