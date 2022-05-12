import { ITrade } from './common';
export declare const addTradeAction: (trades: ITrade[]) => {
    type: string;
    payload: {
        trades: ITrade[];
    };
};
