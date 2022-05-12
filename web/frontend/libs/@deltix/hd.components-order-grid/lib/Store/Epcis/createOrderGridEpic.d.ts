import { IOrderBook } from '@deltix/hd.components-order-book';
import { AnyAction } from 'redux';
import { ActionsObservable, StateObservable } from 'redux-observable';
import { IOrderGridParameters, IOrderGridState } from '../orderGridState';
export declare const createOrderGridEpic: (orderBook: IOrderBook, symbol: string, parameters: IOrderGridParameters, channel: string, appId: string) => (action$: ActionsObservable<AnyAction>, state$: StateObservable<IOrderGridState>) => import("rxjs").Observable<import("redux").Action<any> | {
    type: string;
    payload: {
        symbol: string;
    };
}>;
