import { Action } from 'redux';
import { ActionsObservable, StateObservable } from 'redux-observable';
import { IOrderBookState } from '../orderBookState';
export declare const calculateTradingAmountEpicType = "calculateTradingAmountEpicType";
export declare const calculateTradingAmountEpic: (action$: ActionsObservable<Action>, state$: StateObservable<IOrderBookState>) => import("rxjs").Observable<{
    type: string;
    payload: {
        amount: import("../../tradingAmount").ITradingAmount;
    };
}>;
