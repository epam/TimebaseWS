import { IOrderBookState, ISpawnedEpicDepth } from '@deltix/hd.components-order-book';
import { AnyAction } from 'redux';
import { ActionsObservable, StateObservable } from 'redux-observable';
export declare const updateEpic: (action$: ActionsObservable<AnyAction>, state$: StateObservable<IOrderBookState>, { symbol: spawnedSymbol }: ISpawnedEpicDepth) => import("rxjs").Observable<{
    type: string;
    payload: {
        buy: import("../common").IPricesIntegral[];
        sell: import("../common").IPricesIntegral[];
        middlePrice: import("big.js").Big;
    };
}>;
