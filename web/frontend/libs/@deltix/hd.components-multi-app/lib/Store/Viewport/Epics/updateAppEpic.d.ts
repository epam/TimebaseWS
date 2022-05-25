import { AnyAction } from 'redux';
import { ActionsObservable } from 'redux-observable';
export declare const updateAppEpic: (action$: ActionsObservable<AnyAction>) => import("rxjs").Observable<{
    metadata: any;
    type: any;
}>;
