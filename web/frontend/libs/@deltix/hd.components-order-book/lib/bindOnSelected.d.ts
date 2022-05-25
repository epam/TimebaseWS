import Big from 'big.js';
import { L2MessageSide } from './l2';
import { ELineType } from './Store/orderBookActions';
export declare type OnSelected = (price: Big, quantity: Big, exchange: string | undefined, side: L2MessageSide, type: ELineType) => any;
export declare const bindOnSelected: (dispatch: any) => {
    onSelected: (price: Big, quantity: Big, exchange: string | undefined, side: L2MessageSide, type: ELineType) => void;
};
