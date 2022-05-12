import { AnyAction } from 'redux';
import { ActionsObservable } from 'redux-observable';
export declare const awaitInitializeEpic: (action$: ActionsObservable<AnyAction>) => import("rxjs").Observable<{
    type: string;
}>;
